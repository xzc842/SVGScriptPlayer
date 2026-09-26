import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SVGScriptNodePlayer,
  readScript,
  svgToPng,
} from "../../src/node/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const scriptName = process.argv[2] || "demo.txt";
  const fps = parseInt(process.argv[3], 10) || 30;

  const scriptFile = path.resolve(__dirname, "../scripts", scriptName);
  const framesDir = path.resolve(
    __dirname,
    "../output/frames",
    scriptName.replace(/\.txt$/, "")
  );

  await fs.mkdir(framesDir, { recursive: true });

  console.log("📄 脚本:", scriptFile);
  console.log("🖼  帧目录:", framesDir);
  console.log("");

  const player = new SVGScriptNodePlayer({
    basePath: path.dirname(scriptFile),
  });

  const source = await readScript(scriptFile);
  await player.load(source);

  const duration = player.getDuration();
  const totalFrames = Math.ceil((duration / 1000) * fps);

  console.log(`⏱  时长: ${duration}ms，共 ${totalFrames} 帧\n`);

  const startAt = Date.now();

  for (let i = 0; i < totalFrames; i++) {
    const t = i * (1000 / fps);
    player.seek(t);

    const svg = player.renderer.serialize();
    const png = await svgToPng(svg, {
      engine: "resvg",
      width: 960,
      height: 640,
    });

    const framePath = path.join(
      framesDir,
      `frame-${String(i).padStart(4, "0")}.png`
    );
    await fs.writeFile(framePath, png);

    const pct = Math.round(((i + 1) / totalFrames) * 100);
    process.stdout.write(`\r  导出 ${pct}% (${i + 1}/${totalFrames})`);
  }

  process.stdout.write("\n");
  const elapsed = ((Date.now() - startAt) / 1000).toFixed(1);
  console.log(`✅ 共导出 ${totalFrames} 帧，耗时 ${elapsed}s`);
}

main().catch((err) => {
  console.error("❌ 失败:", err.message);
  console.error(err.stack);
  process.exit(1);
});