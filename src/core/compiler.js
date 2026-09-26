import { CompileError } from "../utils/errors.js";
import { resolveCoord } from "../utils/geometry.js";
import { getEasing } from "../utils/easing.js";
import { parseScript } from "./parser.js";
import { splitTopLevel } from "../utils/string.js";

const CREATE_SHAPES = ["circle", "rect", "line", "path", "image", "text"];
const TRANSFORM_OPS = ["move", "scale", "rotate", "fade"];

export function compile(ast, { templates = {}, config = {} } = {}) {
  const actions = [];
  const context = {
    time: 0,
    lastPosition: null,
    elements: new Map(),
    config: { ...defaultConfig(), ...config },
  };

  for (const node of ast.body) {
    if (node.type === "Directive") {
      compileDirective(node, actions, context, templates);
    }
  }

  return {
    actions,
    duration: context.time,
    config: context.config,
  };
}

function defaultConfig() {
  return {
    size: [800, 600],
    background: "#ffffff",
    loop: false,
    speed: 1.0,
    defaultEasing: "easeOut",
  };
}

function compileDirective(node, actions, context, templates) {
  // 全局配置
  if (node.name === "config") {
    applyConfig(node.params, context);
    return;
  }

  // 时间标记
  if (node.name === "tag") {
    actions.push({
      type: "tag",
      name: node.params.name,
      time: context.time,
    });
    return;
  }

  // 并行组
  if (node.name === "group") {
    compileGroup(node, actions, context, templates);
    return;
  }

  // 模板
  const tpl = templates[node.name];
  if (tpl) {
    compileTemplate(node, tpl, actions, context);
    return;
  }

  // 原子指令
  compileAtomic(node, actions, context);
}

function applyConfig(params, context) {
  const p = { ...params };

  // size: "900x600" → [900, 600]
  if (typeof p.size === "string" && p.size.includes("x")) {
    const parts = p.size.split("x").map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && parts.every(Number.isFinite)) {
      p.size = parts;
    }
  }

  Object.assign(context.config, p);
}

/**
 * 编译模板指令。
 * 关键：合并模板 fields 里定义的默认值。
 */
function compileTemplate(node, tpl, actions, context) {
  const params = applyTemplateDefaults(node.params, tpl);
  const result = tpl.build(params, context);

  const built = Array.isArray(result) ? result : result.actions;
  const endTime = Array.isArray(result)
    ? context.time + (params.duration ?? 0)
    : result.endTime;

  for (const a of built) {
    actions.push({ ...a, time: a.time ?? context.time });
  }
  context.time = endTime ?? context.time;
}

/**
 * 用模板 fields 里的 default 填充缺失字段。
 * 数组类型会浅拷贝，避免多个实例共享同一引用。
 */
function applyTemplateDefaults(params, tpl) {
  const out = { ...params };
  if (!tpl.fields) return out;

  for (const [key, def] of Object.entries(tpl.fields)) {
    if (out[key] === undefined && def.default !== undefined) {
      out[key] = Array.isArray(def.default)
        ? [...def.default]
        : def.default;
    }
  }
  return out;
}

function compileAtomic(node, actions, context) {
  const p = node.params;
  const easing = getEasing(p.easing || context.config.defaultEasing);
  const duration = p.duration ?? 0;
  const delay = p.delay ?? 0;
  const startTime = p.time ?? context.time + delay;

  // 解析位置
  let pos = null;
  if (p.at !== undefined) {
    pos = resolveCoord(p.at, {
      getElement: (id) => context.elements.get(id),
      lastPosition: context.lastPosition,
    });
  }

  // ===== 等待 =====
  if (node.name === "wait") {
    context.time = startTime + (p.ms ?? 0);
    return;
  }

  // ===== 创建类 =====
  if (CREATE_SHAPES.includes(node.name)) {
    const id = p.name || `el_${actions.length}`;
    actions.push({
      type: "create",
      shape: node.name,
      id,
      params: p,
      at: pos,
      time: startTime,
    });
    context.elements.set(id, {
      id,
      shape: node.name,
      position: pos,
      params: p,
    });
    context.lastPosition = pos;
    context.time = startTime + duration;
    return;
  }

  // ===== 变换类 =====
  if (TRANSFORM_OPS.includes(node.name)) {
    let to = undefined;
    if (node.name === "move" && p.to !== undefined) {
      to = resolveCoord(p.to, {
        getElement: (id) => context.elements.get(id),
        lastPosition: context.lastPosition,
      });
    }

    actions.push({
      type: node.name,
      target: p.target,
      params: { ...p, to },
      time: startTime,
      duration,
      easing,
    });
    context.time = startTime + duration;
    return;
  }

  throw new CompileError(`未知指令: ${node.name}`, { line: node.line });
}

/**
 * group：组内所有子指令并行开始，子指令的 at 相对组的 at。
 */
function compileGroup(node, actions, context, templates) {
  const p = node.params;

  const base =
    p.at !== undefined
      ? resolveCoord(p.at, {
          getElement: (id) => context.elements.get(id),
          lastPosition: context.lastPosition,
        })
      : context.lastPosition ?? [0, 0];

  const startTime = context.time + (p.delay ?? 0);

  const childrenAst = parseChildren(p.children);
  if (!childrenAst || childrenAst.body.length === 0) {
    context.time = startTime;
    return;
  }

  const localContext = {
    ...context,
    time: startTime,
    lastPosition: base,
  };

  const groupStartIdx = actions.length;

  for (const child of childrenAst.body) {
    if (child.type !== "Directive") continue;

    const childParams = { ...child.params };
    if (childParams.at !== undefined) {
      const childCoord = resolveCoord(childParams.at, {
        getElement: () => null,
        lastPosition: [0, 0],
      });
      if (Array.isArray(childCoord) && Array.isArray(base)) {
        childParams.at = [
          base[0] + childCoord[0],
          base[1] + childCoord[1],
        ];
      }
    }

    compileAtomic(
      { ...child, params: childParams },
      actions,
      localContext,
      templates
    );
  }

  let maxEnd = startTime;
  for (let i = groupStartIdx; i < actions.length; i++) {
    const a = actions[i];
    const end = (a.time ?? 0) + (a.duration ?? 0);
    if (end > maxEnd) maxEnd = end;
  }

  context.time = maxEnd;
}

function parseChildren(source) {
  if (!source) return null;

  if (Array.isArray(source) && source.length > 0 && source[0]?.type) {
    return { body: source };
  }

  if (Array.isArray(source)) {
    const bodySource = source
      .map((s) => (typeof s === "string" ? s : ""))
      .join("\n");
    return parseScript(bodySource);
  }

  if (typeof source !== "string") return null;

  let inner = source.trim();
  if (inner.startsWith("[") && inner.endsWith("]")) {
    inner = inner.slice(1, -1).trim();
  }
  if (!inner) return null;

  const parts = splitTopLevel(inner, ",");
  return parseScript(parts.join("\n"));
}