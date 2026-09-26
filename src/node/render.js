// src/node/render.js
import { SVGScriptNodePlayer } from "./player.js";
import { readScript } from "./loader.js";
import { renderVideo } from "./video.js";

/**
 * 一行出片：加载脚本 → 渲染视频
 */
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