import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { svgToPng } from "./frame.js";

const require = createRequire(import.meta.url);

export async function renderVideo(options = {}) {
  const {
    player,
    output,
    fps = 30,
    width,
    height,
    format = "mp4",
    codec,
    quality = 23,
    bitrate,
    range,
    engine = "resvg",
    ffmpegPath,
    onProgress,
    onFrame,
  } = options;

  if (!player) throw new Error("renderVideo 需要传入 player");
  if (!player.isLoaded || !player.isLoaded()) {
    throw new Error("player 未加载脚本，先调用 player.load()");
  }

  const duration = player.getDuration();
  const [startTime, endTime] = range ?? [0, duration];
  const span = Math.max(0, endTime - startTime);
  const totalFrames = Math.max(1, Math.ceil((span / 1000) * fps));

  const size = player.config?.size ?? [800, 600];
  const W = width ?? size[0];
  const H = height ?? size[1];

  const enc = codec || defaultCodec(format);
  const ffmpegBin = ffmpegPath || resolveFfmpeg();
  const args = buildFfmpegArgs({
    W, H, fps, format, codec: enc, quality, bitrate, output,
  });

  const ff = spawn(ffmpegBin, args, { stdio: ["pipe", "inherit", "inherit"] });

  const ffExit = new Promise((resolve, reject) => {
    ff.on("error", reject);
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg 退出码 ${code}`));
    });
  });

  const frameDuration = 1000 / fps;

  try {
    for (let i = 0; i < totalFrames; i++) {
      const t = startTime + i * frameDuration;

      // 最后一帧不要超过 endTime
      const clampedT = Math.min(t, endTime);

      player.seek(clampedT);
      const svg = player.renderer.serialize();
      const png = await svgToPng(svg, { engine, width: W, height: H });

      if (onFrame) onFrame(png, i, totalFrames);

      const ok = ff.stdin.write(png);
      if (!ok) {
        await new Promise((r) => ff.stdin.once("drain", r));
      }

      if (onProgress) onProgress(i + 1, totalFrames);
    }

    ff.stdin.end();
    await ffExit;
  } catch (err) {
    try { ff.kill("SIGKILL"); } catch {}
    throw err;
  }

  return { output, frames: totalFrames, duration: span };
}

function defaultCodec(format) {
  switch (format) {
    case "mp4": return "h264";
    case "mov": return "h264";
    case "webm": return "vp9";
    case "gif": return "gif";
    default: return "h264";
  }
}

function buildFfmpegArgs({ W, H, fps, format, codec, quality, bitrate, output }) {
  const args = [
    "-y",
    "-f", "image2pipe",
    "-vcodec", "png",
    "-r", String(fps),
    "-i", "-",
  ];

  if (codec === "h264") {
    args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium");
    if (bitrate) args.push("-b:v", bitrate);
    else args.push("-crf", String(quality));
  } else if (codec === "h265") {
    args.push("-c:v", "libx265", "-pix_fmt", "yuv420p");
    if (bitrate) args.push("-b:v", bitrate);
    else args.push("-crf", String(quality));
  } else if (codec === "vp9") {
    args.push("-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p");
    if (bitrate) args.push("-b:v", bitrate);
    else args.push("-crf", String(quality), "-b:v", "0");
  } else if (codec === "gif") {
    args.push(
      "-vf",
      `fps=${fps},scale=${W}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`
    );
    args.push("-loop", "0");
  }

  // 保证输出尺寸
  args.push("-s", `${W}x${H}`);
  args.push(output);
  return args;
}

function resolveFfmpeg() {
  try {
    const p = require("ffmpeg-static");
    return p;
  } catch {
    return "ffmpeg";
  }
}