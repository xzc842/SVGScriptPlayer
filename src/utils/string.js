export function unquote(value) {
  if (typeof value !== "string") return value;
  const v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1);
  }
  return v;
}

export function isQuoted(value) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  return (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  );
}

export function parseValue(raw) {
  if (typeof raw !== "string") return raw;
  const v = raw.trim();
  if (v === "") return "";

  // 引号字符串
  if (isQuoted(v)) return unquote(v);

  // 布尔 / null
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null") return null;

  // 数组 [a, b, c]
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    return splitTopLevel(inner, ",").map((s) => parseValue(s));
  }

  // 对象 { a: 1, b: 2 }
  if (v.startsWith("{") && v.endsWith("}")) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return {};
    const obj = {};
    for (const pair of splitTopLevel(inner, ",")) {
      const idx = pair.indexOf(":");
      if (idx === -1) continue;
      const k = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      obj[k] = parseValue(val);
    }
    return obj;
  }

  // 数字
  if (!isNaN(v) && v !== "") return parseFloat(v);

  // 其他原样返回
  return v;
}

/**
 * 按分隔符切分，但忽略括号 / 引号内的分隔符。
 */
export function splitTopLevel(source, sep = ",") {
  const parts = [];
  let buf = "";
  let depth = 0;
  let inStr = false;
  let quote = null;

  for (let i = 0; i < source.length; i++) {
    const c = source[i];

    if (inStr) {
      buf += c;
      if (c === quote) inStr = false;
      continue;
    }

    if (c === '"' || c === "'") {
      inStr = true;
      quote = c;
      buf += c;
      continue;
    }

    if (c === "[" || c === "{" || c === "(") {
      depth++;
      buf += c;
      continue;
    }
    if (c === "]" || c === "}" || c === ")") {
      depth--;
      buf += c;
      continue;
    }

    if (c === sep && depth === 0) {
      parts.push(buf.trim());
      buf = "";
      continue;
    }

    buf += c;
  }

  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

/**
 * 对源字符串里的表达式求值。
 * 支持：
 *   - 数组内的数字算术：[100, 500 - 80] → [100, 420]
 *   - 字符串拼接："dot_" + "A" → "dot_A"
 */
export function evaluateExpressions(source) {
  if (typeof source !== "string") return source;

  let result = source;

  // 1. 处理数组内的表达式 [expr, expr, ...]
  result = result.replace(/\[([^\]]+)\]/g, (match, inner) => {
    const parts = splitTopLevel(inner, ",");
    const evaluated = parts.map((p) => evaluateSingle(p.trim()));
    return `[${evaluated.join(", ")}]`;
  });

  // 2. 处理字符串拼接 "a" + "b" + ...
  // 循环处理，直到没有 + 或达到上限
  for (let i = 0; i < 20; i++) {
    const before = result;
    result = result.replace(
      /"([^"\\]*(?:\\.[^"\\]*)*)"\s*\+\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g,
      (m, a, b) => `"${a}${b}"`
    );
    if (result === before) break;
  }

  return result;
}

/**
 * 对单个表达式求值。
 * 只处理安全的形式：
 *   - 纯数字：返回数字字符串
 *   - 数字算术：100 + 50、500 - 80、2 * 3、10 / 2
 *   - 字符串字面量："abc"
 *   - 其他：原样返回
 */
function evaluateSingle(expr) {
  if (typeof expr !== "string") return expr;
  const s = expr.trim();

  // 字符串字面量：原样保留
  if (/^".*"$/.test(s) || /^'.*'$/.test(s)) return s;

  // 数字
  if (/^-?\d+(\.\d+)?$/.test(s)) return s;

  // 纯数字算术表达式（只允许数字、空格、运算符、括号、小数点）
  if (/^[\d\s+\-*/().]+$/.test(s)) {
    try {
      // 只允许数字和运算符，安全
      const result = Function(`"use strict"; return (${s})`)();
      if (typeof result === "number" && Number.isFinite(result)) {
        return String(result);
      }
    } catch (e) {
      // 求值失败，保留原样
    }
  }

  // 其他原样返回
  return s;
}