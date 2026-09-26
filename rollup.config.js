import resolve from "@rollup/plugin-node-resolve";

const external = [
  // Node 端依赖
  "@resvg/resvg-js",
  "ffmpeg-static",
  "sharp",
  // Node 内置模块（带 node: 前缀）
  "node:fs",
  "node:fs/promises",
  "node:path",
  "node:child_process",
  "node:module",
  "node:url",
  "node:os",
  "node:stream",
  "node:util",
  "node:events",
  // Node 内置模块（不带前缀，兼容旧写法）
  "fs",
  "fs/promises",
  "path",
  "child_process",
  "module",
  "url",
  "os",
  "stream",
  "util",
  "events",
];

export default [
  // ── 浏览器 ESM ───────────────────────────────
  {
    input: "src/browser/index.js",
    output: {
      file: "dist/svg-script-player.esm.js",
      format: "esm",
      sourcemap: true,
    },
    plugins: [resolve()],
    external,
  },

  // ── 浏览器 UMD（供 <script> / unpkg / jsDelivr）──
  {
    input: "src/browser/index.js",
    output: {
      file: "dist/svg-script-player.umd.js",
      format: "umd",
      name: "SVGScriptPlayer",
      sourcemap: true,
    },
    plugins: [resolve()],
    external,
  },

  // ── Node ESM ─────────────────────────────────
  {
    input: "src/node/index.js",
    output: {
      file: "dist/svg-script-player.node.js",
      format: "esm",
      sourcemap: true,
    },
    plugins: [resolve()],
    external,
  },

  // ── Node CJS ─────────────────────────────────
  {
    input: "src/node/index.js",
    output: {
      file: "dist/svg-script-player.node.cjs",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
    plugins: [resolve()],
    external,
  },
];