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

/**
 * 从 start 行开始，读取一个 { ... } 块。
 * 返回 { params, next }：
 *   - params：解析后的参数对象
 *   - next：块结束后的下一行索引
 */
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

/**
 * 解析参数列表。
 * 用 splitTopLevel 按顶层逗号切分，忽略 [] {} () 和引号内的逗号。
 */
function parseParams(source) {
  const params = {};
  const parts = splitTopLevel(source, ",");

  for (const part of parts) {
    const seg = part.trim();
    if (!seg) continue;

    const eq = seg.indexOf("=");
    if (eq === -1) continue;

    const key = seg.slice(0, eq).trim();
    const rawVal = seg.slice(eq + 1).trim();
    if (!key) continue;

    // children 保持原始字符串，由 expander 处理
    if (key === "children") {
      params[key] = rawVal;
      continue;
    }

    params[key] = parseValue(rawVal);
  }

  return params;
}

/**
 * 解析 def。
 * 关键：def.body 是 { 和 } 之间的内容，不包含 def 头和外层花括号。
 */
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

  // 用 readBlock 找到 def 块的范围
  const { next } = readBlock(lines, start, start + 1, "inline");

  // 拼出 def 块的完整文本
  const blockLines = lines.slice(start, next);
  const blockText = blockLines.join("\n");

  // 取第一个 { 和最后一个 } 之间的内容
  const firstBrace = blockText.indexOf("{");
  const lastBrace = blockText.lastIndexOf("}");
  const body = blockText.slice(firstBrace + 1, lastBrace).trim();

  return {
    node: {
      type: "Def",
      name,
      params,
      body,
    },
    next,
  };
}