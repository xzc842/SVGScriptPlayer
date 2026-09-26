/**
 * Node 端渲染示例
 *
 * 用法：
 *   node examples/node/render.js                      # 渲染 demo.txt
 *   node examples/node/render.js demo2.txt            # 渲染指定脚本
 *   node examples/node/render.js demo2.txt out.mp4    # 指定输入输出
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderScriptToVideo } from "../../src/node/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const scriptName = process.argv[2] || "../demo.txt";
  const outputName = process.argv[3] || scriptName.replace(/\.txt$/, ".mp4");

  const scriptFile = path.resolve(
    __dirname,
    "../scripts",
    scriptName
  );
  const output = path.resolve(__dirname, "../output", outputName);

  console.log("📄 脚本:", scriptFile);
  console.log("🎬 输出:", output);
  console.log("");

  const startAt = Date.now();

  try {
    await renderScriptToVideo({
      scriptFile,
      output,
      fps: 30,
      width: 1280,
      height: 854,   // 3:2，和脚本 config 的 960x640 比例一致
      format: "mp4",
      codec: "h264",
      quality: 20,
      engine: "resvg",
      onProgress: (frame, total) => {
        const pct = Math.round((frame / total) * 100);
        const bar = "█".repeat(Math.floor(pct / 2)).padEnd(50, "░");
        process.stdout.write(`\r  [${bar}] ${pct}% (${frame}/${total})`);
      },
    });

    const elapsed = ((Date.now() - startAt) / 1000).toFixed(1);
    process.stdout.write("\n");
    console.log(`✅ 渲染完成，耗时 ${elapsed}s`);
  } catch (err) {
    process.stdout.write("\n");
    console.error("❌ 渲染失败:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();