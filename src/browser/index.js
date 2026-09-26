import { Player } from "../core/player.js";
import { createBrowserLoader } from "./loader.js";
import { queryContainer } from "./dom.js";
import {
  loadBuiltinTemplates,
  getAllTemplates,
  registerTemplate,
  getTemplate,
} from "../templates/index.js";

// 纯逻辑模块，浏览器也能用，一并暴露
import { SVGScriptError } from "../utils/errors.js";
import { parseScript } from "../core/parser.js";
import { expandDefs } from "../core/expander.js";
import { compile } from "../core/compiler.js";

loadBuiltinTemplates();

/**
 * 兼容 `new SVGScriptPlayer(...)` 的写法。
 * 内部直接返回一个 Player 实例，避免 extends 出问题。
 */
class SVGScriptPlayer {
  constructor(options = {}) {
    const container = options.container
      ? queryContainer(options.container)
      : null;

    const loader =
      options.loadFile || createBrowserLoader(options.basePath || "");

    const player = new Player({
      ...options,
      container,
      mode: "dom",
      loadFile: loader,
      templates: {
        ...getAllTemplates(),
        ...(options.templates || {}),
      },
    });

    // 手动挂 registerTemplate
    player.registerTemplate = function (name, tpl) {
      this.templates[name] = tpl;
      registerTemplate(name, tpl);
    };

    // 关键：class 构造函数返回对象时，new 得到的就是这个对象
    return player;
  }
}

export {
  SVGScriptPlayer,
  registerTemplate,
  getTemplate,
  getAllTemplates,
  SVGScriptError,
  parseScript,
  expandDefs,
  compile,
};