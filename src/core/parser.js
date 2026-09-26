import { ParseError } from "../utils/errors.js";
import { parseValue, splitTopLevel, unquote } from "../utils/string.js";

export function parseScript(source, { file = "inline" } = {}) {
  const lines = source.split(/\r?\n/);
  const ast = { type: "Program", body: [], file };
  let i = 0;

  while (i < lines.length) {
    const line = stripComment(lines[i]).trim();
    if (!line) {
      i++;
      continue;
    }

    const lineNo = i + 1;

    // import
    if (line.startsWith("import")) {
      const rest = line.slice(6).trim();
      ast.body.push({
        type: "Import",
        path: unquote(rest),
        line: lineNo,
      });
      i++;
      continue;
    }

    // def
    if (/^def\s/.test(line)) {
      const { node, next } = parseDef(lines, i);
      node.line = lineNo;
      ast.body.push(node);
      i = next;
      continue;
    }

    // 指令：名字 { ... }
    const m = line.match(/^([A-Za-z_][\w-]*)\s*\{/);
    if (m) {
      const name = m[1];
      const { params, next } = readBlock(lines, i, lineNo, file);
      ast.body.push({
        type: "Directive",
        name,
        params,
        line: lineNo,
        file,
      });
      i = next;
      continue;
    }

    throw new ParseError(`无法解析的语句: ${line}`, { file, line: lineNo });
  }

  return ast;
}

function stripComment(line) {
  let inStr = false;
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inStr) {
      if (c === quote) inStr = false;
    } else if (c === '"' || c === "'") {
      inStr = true;
      quote = c;
    } else if (c === "#") {
      return line.slice(0, i);
    }
  }
  return line;
}

function readBlock(lines, start, startLine, file) {
  let i = start;
  let depth = 0;
  let buffer = "";
  let firstBrace = false;

  while (i < lines.length) {
    const line = stripComment(lines[i]);
    for (const ch of line) {
      if (ch === "{") {
        depth++;
        firstBrace = true;
      } else if (ch === "}") {
        depth--;
      }
    }
    buffer += line + "\n";
    if (firstBrace && depth === 0) {
      i++;
      break;
    }
    i++;
  }

  if (depth !== 0) {
    throw new ParseError(`花括号未闭合`, { file, line: startLine });
  }

  const open = buffer.indexOf("{");
  const close = buffer.lastIndexOf("}");
  const inner = buffer.slice(open + 1, close);

  const params = parseParams(inner);
  return { params, next: i };
}

function parseParams(source) {
  const params = {};
  // 按顶层逗号切分
  const parts = splitTopLevel(source, ",");

  for (const part of parts) {
    const seg = part.trim();
    if (!seg) continue;

    const eq = seg.indexOf("=");
    if (eq === -1) continue;

    const key = seg.slice(0, eq).trim();
    const rawVal = seg.slice(eq + 1).trim();
    if (!key) continue;

    params[key] = parseValue(rawVal);
  }

  return params;
}

function parseDef(lines, start) {
  const header = stripComment(lines[start]).trim();
  const m = header.match(/^def\s+([A-Za-z_][\w-]*)\s*\(([^)]*)\)\s*\{/);
  if (!m) {
    throw new ParseError(`def 语法错误: ${header}`, { line: start + 1 });
  }

  const name = m[1];
  const params = m[2]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const eq = s.indexOf("=");
      if (eq === -1) return { name: s, default: undefined };
      const pname = s.slice(0, eq).trim();
      const defVal = s.slice(eq + 1).trim();
      return { name: pname, default: parseValue(defVal) };
    });

  // 收集函数体
  let i = start;
  let depth = 0;
  let started = false;
  const bodyLines = [];

  while (i < lines.length) {
    const line = lines[i];
    let lineStartDepth = depth;

    for (const ch of line) {
      if (ch === "{") {
        depth++;
        if (depth === 1) started = true;
      } else if (ch === "}") {
        depth--;
      }
    }

    // 只收集 body 内的行（不包含最外层 def 的 {}）
    if (started) {
      if (lineStartDepth >= 1) {
        bodyLines.push(line);
      } else if (depth >= 1) {
        bodyLines.push(line);
      }
    }

    if (started && depth === 0) {
      i++;
      break;
    }
    i++;
  }

  return {
    node: {
      type: "Def",
      name,
      params,
      body: bodyLines.join("\n"),
    },
    next: i,
  };
}