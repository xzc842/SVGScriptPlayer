export function parseCoord(value) {
  if (value === "_") return "_";

  // 数组：直接转数字
  if (Array.isArray(value)) {
    return [num(value[0]), num(value[1])];
  }

  // 字符串坐标："100,200" / "+50,-30" / "@dot1"
  if (typeof value === "string") {
    const v = value.trim();

    // 引用 @name
    if (v.startsWith("@")) return { ref: v.slice(1) };

    // 用逗号切分（顶层）
    const parts = v.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length !== 2) return [0, 0];

    const [sx, sy] = parts;
    const relX = sx.startsWith("+") || sx.startsWith("-");
    const relY = sy.startsWith("+") || sy.startsWith("-");

    if (relX || relY) {
      return { rel: [num(sx), num(sy)] };
    }
    return [num(sx), num(sy)];
  }

  // 数字：视为 [x, 0]
  if (typeof value === "number") return [value, 0];

  return [0, 0];
}

export function resolveCoord(coord, context) {
  if (!coord || coord === "_") {
    return context?.lastPosition ?? [0, 0];
  }

  // 引用
  if (coord && typeof coord === "object" && coord.ref) {
    const el = context?.getElement?.(coord.ref);
    if (el && Array.isArray(el.position)) return el.position;
    return [0, 0];
  }

  // 相对
  if (coord && typeof coord === "object" && coord.rel) {
    const base = context?.lastPosition ?? [0, 0];
    return [base[0] + coord.rel[0], base[1] + coord.rel[1]];
  }

  // 数组
  if (Array.isArray(coord)) {
    return [num(coord[0]), num(coord[1])];
  }

  return [0, 0];
}

function num(v) {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}