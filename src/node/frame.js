import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let ResvgCtor = null;
let sharpFn = null;

export async function svgToPng(svg, { engine = "resvg", width, height } = {}) {
  if (engine === "resvg") return await useResvg(svg, { width, height });
  if (engine === "sharp") return await useSharp(svg, { width, height });
  throw new Error(`未知渲染引擎: ${engine}`);
}

async function useResvg(svg, { width, height }) {
  if (!ResvgCtor) {
    const mod = require("@resvg/resvg-js");
    ResvgCtor = mod.Resvg;
  }
  const opts = {};
  if (width && height) {
    opts.fitTo = { mode: "width", value: width };
  } else if (width) {
    opts.fitTo = { mode: "width", value: width };
  }
  const r = new ResvgCtor(svg, opts);
  const png = r.render().asPng();
  return Buffer.from(png);
}

async function useSharp(svg, { width, height }) {
  if (!sharpFn) {
    sharpFn = require("sharp");
  }
  let img = sharpFn(Buffer.from(svg));
  if (width && height) img = img.resize(width, height);
  else if (width) img = img.resize({ width });
  return await img.png().toBuffer();
}