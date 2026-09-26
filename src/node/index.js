// src/node/index.js
import { Player } from "../core/player.js";
import { createNodeLoader, readScript } from "./loader.js";
import { svgToPng } from "./frame.js";
import { renderVideo } from "./video.js";
import { renderBatch } from "./batch.js";
import { SVGScriptNodePlayer } from "./player.js";
import { renderScriptToVideo } from "./render.js";
import {
  registerTemplate,
  getTemplate,
  getAllTemplates,
} from "../templates/index.js";

// 统一导出
export {
  Player,
  SVGScriptNodePlayer,
  renderScriptToVideo,
  renderVideo,
  renderBatch,
  svgToPng,
  readScript,
  createNodeLoader,
  registerTemplate,
  getTemplate,
  getAllTemplates,
};