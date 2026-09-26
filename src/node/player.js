// src/node/player.js
import { Player } from "../core/player.js";
import { createNodeLoader } from "./loader.js";
import {
  loadBuiltinTemplates,
  getAllTemplates,
  registerTemplate,
} from "../templates/index.js";

// 确保内置模板已注册
loadBuiltinTemplates();

export class SVGScriptNodePlayer extends Player {
  constructor(options = {}) {
    const basePath = options.basePath || process.cwd();
    const loader = options.loadFile || createNodeLoader(basePath);

    super({
      ...options,
      mode: "node",
      container: null,
      loadFile: loader,
      templates: {
        ...getAllTemplates(),
        ...(options.templates || {}),
      },
    });
  }

  registerTemplate(name, tpl) {
    this.templates[name] = tpl;
    registerTemplate(name, tpl);
  }
}