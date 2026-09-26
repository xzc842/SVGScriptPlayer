import { Player } from "../core/player.js";
import { createNodeLoader, readScript } from "./loader.js";
import { svgToPng } from "./frame.js";
import { renderVideo } from "./video.js";
import { renderBatch } from "./batch.js";
import {
  loadBuiltinTemplates,
  getAllTemplates,
  registerTemplate,
  getTemplate,
} from "../templates/index.js";

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

// 一行出片：加载脚本 → 渲染视频
export async function renderScriptToVideo({
  script,
  scriptFile,
  ...options
} = {}) {
  const source = script ?? (await readScript(scriptFile));
  const player = new SVGScriptNodePlayer({
    basePath: options.basePath,
    templates: options.templates,
    config: options.config,
  });
  await player.load(source);
  return await renderVideo({ ...options, player });
}

export {
  Player,
  SVGScriptNodePlayer,
  renderVideo,
  renderBatch,
  renderScriptToVideo,
  svgToPng,
  readScript,
  createNodeLoader,
  registerTemplate,
  getTemplate,
  getAllTemplates,
};

export default {
  Player,
  SVGScriptNodePlayer,
  renderVideo,
  renderBatch,
  renderScriptToVideo,
  svgToPng,
};