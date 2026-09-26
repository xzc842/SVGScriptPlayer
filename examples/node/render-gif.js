import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderScriptToVideo } from "../../src/node/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const scriptName = process.argv[2] || "demo.txt";
  const outputName = process.argv[3] || scriptName.replace(/\.txt$/, ".gif");

  const scriptFile = path.resolve(__dirname, "../scripts", scriptName);
  const output = path.resolve(__dirname, "../output", outputName);

  console.log("📄 脚本:", scriptFile);
  console.log("🎬 输出:", output);
  console.log("");

  const startAt = Date.now();

  try {
    await renderScriptToVideo({
      scriptFile,
      output,
      fps: 15,
      width: 640,
      height: 427,
      format: "gif",
      codec: "gif",
      onProgress: (frame, total) => {
        const pct = Math.round((frame / total) * 100);
        process.stdout.write(`\r  渲染 ${pct}% (${frame}/${total})`);
      },
    });

    process.stdout.write("\n");
    const elapsed = ((Date.now() - startAt) / 1000).toFixed(1);
    console.log(`✅ 渲染完成，耗时 ${elapsed}s`);
  } catch (err) {
    process.stdout.write("\n");
    console.error("❌ 渲染失败:", err.message);
    process.exit(1);
  }
}

main();