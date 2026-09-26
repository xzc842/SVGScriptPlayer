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

  // 其他原样返回（如颜色、标识符）
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