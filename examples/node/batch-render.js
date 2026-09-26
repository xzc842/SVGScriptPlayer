import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { renderBatch } from "../../src/node/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const scriptsDir = path.resolve(__dirname, "../scripts");
  const outputDir = path.resolve(__dirname, "../output");

  await fs.mkdir(outputDir, { recursive: true });

  const files = (await fs.readdir(scriptsDir))
    .filter((f) => f.endsWith(".txt"))
    .sort();

  if (files.length === 0) {
    console.log("没有找到 .txt 脚本");
    return;
  }

  console.log(`找到 ${files.length} 个脚本，开始批量渲染\n`);

  const jobs = files.map((f) => ({
    scriptFile: path.join(scriptsDir, f),
    output: path.join(outputDir, f.replace(/\.txt$/, ".mp4")),
  }));

  const startAt = Date.now();

  const results = await renderBatch(jobs, {
    fps: 30,
    width: 1280,
    height: 854,
    format: "mp4",
    codec: "h264",
    quality: 20,
    engine: "resvg",
    concurrency: 2,
  });

  const elapsed = ((Date.now() - startAt) / 1000).toFixed(1);

  console.log("\n===== 结果 =====");
  for (const r of results) {
    if (r.status === "ok") {
      console.log(`✅ ${path.basename(r.output)}  (${r.frames} 帧)`);
    } else {
      console.log(`❌ ${path.basename(r.output)}  ${r.error}`);
    }
  }

  console.log(`\n总耗时 ${elapsed}s`);
}

main().catch((err) => {
  console.error("❌ 失败:", err.message);
  process.exit(1);
});