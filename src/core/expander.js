import { parseScript } from "./parser.js";
import { ParseError } from "../utils/errors.js";
import { splitTopLevel } from "../utils/string.js";

/**
 * 展开所有 def 调用。
 * 特别处理 group 的 children：
 *   - 如果 children 是字符串，先解析成 AST
 *   - 然后对每个子指令展开 def
 *   - 嵌套 group 递归处理
 */
export function expandDefs(ast) {
  const defs = new Map();
  for (const node of ast.body) {
    if (node.type === "Def") defs.set(node.name, node);
  }

  const out = { ...ast, body: [] };
  for (const node of ast.body) {
    if (node.type === "Def") continue;

    if (node.type === "Directive" && node.name === "group") {
      out.body.push(expandGroupDefs(node, defs));
      continue;
    }

    if (node.type === "Directive" && defs.has(node.name)) {
      out.body.push(...expandDefCall(defs.get(node.name), node, defs));
    } else {
      out.body.push(node);
    }
  }
  return out;
}

/**
 * 展开 group 的 children 里的 def。
 * children 可能是：
 *   1. 字符串 "[ xxx { ... }, yyy { ... } ]"
 *   2. AST 数组（已经解析过）
 */
function expandGroupDefs(node, defs) {
  const children = node.params.children;
  if (!children) return node;

  // 1. 统一拿到 AST 数组
  let childrenAst = [];

  if (Array.isArray(children) && children.length > 0 && children[0]?.type) {
    // 已经是 AST 数组
    childrenAst = children;
  } else if (typeof children === "string") {
    const parsed = parseChildrenString(children);
    if (!parsed) return node;
    childrenAst = parsed.body;
  } else if (Array.isArray(children)) {
    // 字符串数组
    const bodySource = children
      .map((s) => (typeof s === "string" ? s : ""))
      .join("\n");
    const parsed = parseScript(bodySource);
    childrenAst = parsed.body;
  } else {
    return node;
  }

  // 2. 对每个子节点展开 def
  const expandedBody = [];
  for (const child of childrenAst) {
    if (child.type !== "Directive") {
      expandedBody.push(child);
      continue;
    }

    if (child.name === "group") {
      // 嵌套 group：递归
      expandedBody.push(expandGroupDefs(child, defs));
    } else if (defs.has(child.name)) {
      // def 调用：展开
      expandedBody.push(...expandDefCall(defs.get(child.name), child, defs));
    } else {
      // 普通指令：原样保留
      expandedBody.push(child);
    }
  }

  return {
    ...node,
    params: { ...node.params, children: expandedBody },
  };
}

/**
 * 把 children 字符串解析成 AST。
 * 输入形如：
 *   [ xxx { ... }, yyy { ... } ]
 *   xxx { ... }           （单条）
 */
function parseChildrenString(source) {
  let inner = source.trim();
  if (inner.startsWith("[") && inner.endsWith("]")) {
    inner = inner.slice(1, -1).trim();
  }
  if (!inner) return null;

  const parts = splitTopLevel(inner, ",");
  if (parts.length === 0) return null;

  const bodySource = parts.join("\n");
  return parseScript(bodySource);
}

/**
 * 展开一次 def 调用。
 * - 绑定参数（有默认值则用默认值）
 * - 替换 body 中的 @param
 * - 递归展开 body 里的 def
 */
function expandDefCall(def, call, defs) {
  const bindings = {};
  for (const p of def.params) {
    if (call.params[p.name] !== undefined) {
      bindings[p.name] = call.params[p.name];
    } else if (p.default !== undefined) {
      bindings[p.name] = p.default;
    } else {
      throw new ParseError(`def ${def.name} 缺少参数: ${p.name}`, {
        line: call.line,
      });
    }
  }

  let body = def.body;
  for (const [k, v] of Object.entries(bindings)) {
    const re = new RegExp(`@${k}\\b`, "g");
    body = body.replace(re, formatValue(v));
  }

  const ast = parseScript(body, { file: `<def:${def.name}>` });

  const out = [];
  for (const node of ast.body) {
    if (node.type !== "Directive") continue;

    if (node.name === "group") {
      out.push(expandGroupDefs(node, defs));
    } else if (defs.has(node.name)) {
      out.push(...expandDefCall(defs.get(node.name), node, defs));
    } else {
      out.push(node);
    }
  }
  return out;
}

function formatValue(v) {
  if (typeof v === "string") return `"${v}"`;
  if (Array.isArray(v)) return `[${v.join(",")}]`;
  return String(v);
}