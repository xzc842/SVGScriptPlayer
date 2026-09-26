import resolve from "@rollup/plugin-node-resolve";

const external = [
  "@resvg/resvg-js",
  "ffmpeg-static",
  "sharp",
  "node:fs/promises",
  "node:path",
  "node:child_process",
  "node:module",
  "node:url",
  "fs",
  "path",
  "child_process",
  "module",
  "url",
];

export default [
  // 浏览器 ESM
  {
    input: "src/browser/index.js",
    output: {
      file: "dist/svg-script-player.esm.js",
      format: "esm",
      sourcemap: true,
    },
    external,
  },
  // 浏览器 UMD
  {
    input: "src/browser/index.js",
    output: {
      file: "dist/svg-script-player.umd.js",
      format: "umd",
      name: "SVGScriptPlayer",
      sourcemap: true,
    },
    external,
  },
  // Node ESM
  {
    input: "src/node/index.js",
    output: {
      file: "dist/svg-script-player.node.js",
      format: "esm",
      sourcemap: true,
    },
    external,
  },
  // Node CJS  ← 新增
  {
    input: "src/node/index.js",
    output: {
      file: "dist/svg-script-player.node.cjs",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
    external,
  },
];