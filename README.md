# SVG Script Player
[![npm version](https://img.shields.io/npm/v/svg-script-player.svg)](https://www.npmjs.com/package/svg-script-player)
[![npm downloads](https://img.shields.io/npm/dm/svg-script-player.svg)](https://www.npmjs.com/package/svg-script-player)
[![license](https://img.shields.io/npm/l/svg-script-player.svg)](https://github.com/xzc842/SVGScriptPlayer/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/xzc842/SVGScriptPlayer.svg?style=social)](https://github.com/xzc842/SVGScriptPlayer)
> A runtime for describing SVG animations and interactive scenes with text scripts.

-->[中文版README](README-zh.md)

A scripting language + player + renderer for describing animations with **structured text**.

- **Write animations** → In text, as simple as writing a config
- **AI generation** → Linear syntax, LLM-friendly, line-by-line verifiable
- **Browser playback** → Real-time rendering, event callbacks
- **Node video export** → FFmpeg renders to MP4 / GIF / image sequences
- **Interactive** → Embed HTML via `div` slots, events flow back to AI

```
dialog {
  at = [300, 200],
  speaker = "System",
  text = "Hello, world",
  typing = true
}
```

Three lines, one dialog bubble with a typewriter effect.

---

## Why

Today's AI can generate code, text, and images, but **generating "playable animations" has always been hard**:

- Generating SVG + JS code → easily produces non-runnable results, unverifiable
- Using Lottie / Rive → binary formats, AI cannot generate directly
- Using After Effects → proprietary format, not text

**SVG Script Player downgrades animation into structured text**:

```
Script → Parse → Compile → Render
```

Every step is verifiable, locatable, and correctable. This is **the last piece of the puzzle for AI-generated animation**.

---

## Features

| Feature | Description |
|------|------|
| 📝 **Text script** | Linear, self-explanatory, line-by-line verifiable |
| 🎬 **Real-time browser playback** | Play / pause / seek / speed control |
| 🎥 **Node video rendering** | FFmpeg export to MP4 / WebM / GIF / PNG sequence |
| 🧩 **Built-in templates** | `dialog`, `card`, extensible |
| 🎯 **Tag anchors** | JS seek, event listening |
| 🖼 **div slots** | Embed arbitrary HTML, event callbacks |
| 🔄 **AI closed loop** | Structured event feedback, AI generates next step |
| 🧬 **def macros** | Define reusable fragments |
| 📦 **import** | Multi-file composition |

---

## Installation

```bash
npm install svg-script-player
```

**For Node video rendering**, additionally:

```bash
npm install ffmpeg-static    # optional; falls back to system ffmpeg
npm install sharp            # optional; alternative rendering engine
```

---

## Quick Start

### Browser

```html
<div id="stage"></div>

<script type="module">
  import SVGScriptPlayer from "svg-script-player";

  const player = new SVGScriptPlayer({ container: "#stage" });

  await player.load(`
    config { size = 800x600, background = "#0f172a" }

    circle { at = [400, 300], r = 50, fill = "#4f46e5", name = "dot" }

    move { target = "dot", to = [600, 300], duration = 800 }

    dialog {
      at = [200, 500],
      text = "Move complete",
      speaker = "System"
    }
  `);

  player.play();
</script>
```

### Node Video Rendering

```js
import { renderScriptToVideo } from "svg-script-player/node";

await renderScriptToVideo({
  scriptFile: "./intro.txt",
  output: "./out/intro.mp4",
  fps: 30,
  width: 1920,
  height: 1080,
  onProgress: (i, total) => {
    process.stdout.write(`\rRendering ${i}/${total}`);
  },
});
```

### CDN

```html
<script src="https://unpkg.com/svg-script-player"></script>
<script>
  const player = new SVGScriptPlayer({ container: "#stage" });
  player.load(script).then(() => player.play());
</script>
```

---

## Script Example

```
# ============================================
# Three circles bouncing in sequence + dialog + card
# ============================================

config {
  size = 900x600,
  background = "#0f172a",
  defaultEasing = "easeOut"
}

# Define macro
def dot(color, r) {
  circle {
    at = [0, 0],
    r = @r,
    fill = @color,
    stroke = "#ffffff",
    stroke-width = 2
  }
}

tag { name = "start" }

# Three circles appear in parallel
group {
  at = [250, 250],
  children = [
    dot { at = [0, 0],   color = "#4f46e5", r = 40, name = "a" },
    dot { at = [200, 0], color = "#ef4444", r = 40, name = "b" },
    dot { at = [400, 0], color = "#10b981", r = 40, name = "c" }
  ]
}

# Bounce in sequence
move { target = "a", to = [250, 220], duration = 200 }
move { target = "a", to = [250, 250], duration = 200 }
move { target = "b", to = [450, 220], duration = 200 }
move { target = "b", to = [450, 250], duration = 200 }
move { target = "c", to = [650, 220], duration = 200 }
move { target = "c", to = [650, 250], duration = 200 }

# Dialog
dialog {
  at = [120, 380],
  speaker = "System",
  text = "All three circles have bounced",
  side = "left",
  duration = 2200
}

dialog {
  at = [520, 380],
  speaker = "User",
  text = "Looks good",
  side = "right",
  theme = "primary",
  typing = true,
  duration = 2200
}

# Card
card {
  at = [450, 220],
  title = "Demo Complete",
  subtitle = "3 circles · 2 dialogs · 1 card",
  icon = "✅",
  accent = "#10b981",
  duration = 3000
}

tag { name = "end" }
```

**Running this script** → three circles appear, bounce, two dialogs, and a card pops up.

---

## Script Syntax Overview

### Statement Format

```
commandName  { parameters }
```

### Position

```
at = [100, 200]       Absolute
at = [+50, -30]       Relative
at = "@dot"           Reference named element
at = "_"              Same as previous
```

### Atomic Commands

```
circle  { at, r, fill, stroke, name }
rect    { at, w, h, rx, fill, stroke, name }
line    { at, to, stroke, stroke-width }
text    { at, content, size, color, anchor }
image   { at, src, w, h }
path    { at, d, stroke, fill }

move    { target, to, duration, easing }
scale   { target, factor, duration }
rotate  { target, angle, duration }
fade    { target, to, duration }

wait    { ms }
tag     { name }
```

### Control Commands

```
config  { size, background, loop, speed, defaultEasing }
group   { at, children }
```

### Template Commands

```
dialog  { at, text, speaker, side, theme, typing, duration, avatar }
card    { at, title, subtitle, icon, image, accent, duration, entrance }
```

### Reuse

```
def name(params) {
  command { ... @params ... }
}

import "other.txt"
```

Full syntax reference: [`docs/script.md`](docs/script.md).

---

## JS API

### Loading & Playback

```js
const player = new SVGScriptPlayer({ container: "#stage" });

await player.load(scriptText);         // From string
await player.loadFile("intro.txt");    // From file

player.play();
player.pause();
player.toggle();
player.reset();
player.seek(2500);                     // Seek to 2500ms
player.seekTag("middle");              // Seek to tag
player.setSpeed(1.5);
```

### State Queries

```js
player.getDuration();       // Total duration (ms)
player.getCurrentTime();    // Current time
player.getProgress();       // 0~1
player.isPlayingState();
player.getTags();           // Tag list
player.getSceneSnapshot();  // Current scene snapshot
```

### Events

```js
player.on("play", () => {});
player.on("pause", () => {});
player.on("complete", () => {});
player.on("tag", (name, time) => {});
player.on("timeupdate", (time, progress) => {});
player.on("slot", (event) => {});
```

Full API reference: [`docs/api.md`](docs/api.md).

---

## Slots & AI Closed Loop

The `div` command in a script creates an interactive area:

```
dialog { at = [300,200], text = "Do you choose A or B?" }

div {
  at = [200, 320],
  w = 400,
  h = 100,
  id = "quiz1"
}
```

Inject HTML from JS:

```js
// Example: AI application
player.getSlot("quiz1").setHTML(`
  <button data-event="click" data-value="A">A</button>
  <button data-event="click" data-value="B">B</button>
`);

player.on("slot", async (event) => {
  if (event.slotId === "quiz1") {
    const answer = event.payload.value;

    // Send back to AI
    const response = await ai.chat({
      role: "user",
      content: `User chose ${answer}`,
      context: player.getSceneSnapshot(),
    });

    // AI generates new script
    await player.load(response.script);
    player.play();
  }
});
```

**This is the foundation for AI-controlled user interfaces**: AI generates scene → user interacts → events flow back → AI generates next step.

---

## Node Rendering

### Single Render

```js
import { renderScriptToVideo } from "svg-script-player/node";

await renderScriptToVideo({
  scriptFile: "./intro.txt",
  output: "./out/intro.mp4",
  fps: 30,
  width: 1920,
  height: 1080,
  format: "mp4",           // mp4 | webm | gif | mov
  codec: "h264",           // h264 | h265 | vp9 | gif
  quality: 23,             // CRF
  onProgress: (i, total) => {},
});
```

### Batch Render

```js
import { renderBatch } from "svg-script-player/node";

await renderBatch([
  { scriptFile: "./a.txt", output: "./a.mp4" },
  { scriptFile: "./b.txt", output: "./b.mp4" },
], {
  fps: 30,
  concurrency: 4,
});
```

### Export Image Sequence

```js
import { SVGScriptNodePlayer, svgToPng } from "svg-script-player/node";

const player = new SVGScriptNodePlayer();
await player.loadFile("./intro.txt");

for (let i = 0; i < totalFrames; i++) {
  player.seek(i * 1000 / 30);
  const svg = player.renderer.serialize();
  const png = await svgToPng(svg, { width: 1920, height: 1080 });
  await fs.writeFile(`frames/${i}.png`, png);
}
```

### Render with Loaded Player

```js
import { SVGScriptNodePlayer, renderVideo } from "svg-script-player/node";

const player = new SVGScriptNodePlayer();
await player.load(source);
await renderVideo({ player, output: "out.mp4", fps: 30 });
```

---

## Templates

Built-in templates:

| Template | Purpose |
|------|------|
| `dialog` | Dialog bubble (with avatar / typewriter) |
| `card` | Card popup (icon / theme color / entrance) |

Usage:

```
dialog { at = [200, 200], text = "Hello", typing = true }
card   { at = [400, 300], title = "Done", accent = "#10b981" }
```

Custom template:

```js
import { registerTemplate } from "svg-script-player";

registerTemplate("myTemplate", {
  name: "myTemplate",
  fields: {
    at: { type: "coord", default: [100, 100] },
    text: { type: "string", required: true },
    duration: { type: "number", default: 2000 },
  },
  build(params, ctx) {
    return {
      actions: [
        { type: "create", shape: "circle", id: "c", at: params.at, params: { r: 40, fill: "red" }, time: ctx.time },
        { type: "fade", target: "c", params: { to: 1 }, time: ctx.time, duration: 300 },
      ],
      endTime: ctx.time + params.duration,
    };
  },
});
```

See [`docs/templates.md`](docs/templates.md) for details.

---

## Documentation

| Document | Content |
|------|------|
| [`docs/syntax.md`](docs/syntax.md) | Full script syntax reference |
| [`docs/api.md`](docs/api.md) | JS API |
| [`docs/templates.md`](docs/templates.md) | Template field tables & custom templates |
| [`docs/ai-prompt.md`](docs/ai-prompt.md) | Prompt templates for AI |

---

## Development

```bash
# Install dependencies
npm install
# Build
npm run build
```

---

## Architecture

```
             Script (.txt)
                ↓
        ┌───────────────┐
        │    parser     │  Text → AST
        └───────────────┘
                ↓
        ┌───────────────┐
        │   importer    │  Expand import
        └───────────────┘
                ↓
        ┌───────────────┐
        │   expander    │  Expand def macros
        └───────────────┘
                ↓
        ┌───────────────┐
        │   compiler    │  AST → action queue
        └───────────────┘
                ↓
        ┌───────────────┐
        │   timeline    │  Timeline + tag index
        └───────────────┘
                ↓
        ┌───────────────┐         ┌──────────────┐
        │   renderer    │ ──────→ │  DOM (Browser)│
        │               │         ├──────────────┤
        │               │ ──────→ │  String (Node)│
        └───────────────┘         └──────────────┘
                ↓                         ↓
        ┌───────────────┐         ┌──────────────┐
        │    player     │         │   FFmpeg     │
        │  Playback     │         │  Video render │
        └───────────────┘         └──────────────┘
```

**7 atomic actions**: `create` / `move` / `scale` / `rotate` / `fade` / `wait` / `tag`

**Templates**: Expanded into atomic actions at compile time, no new action types invented.

---

## Who Needs This

- **AI application developers**: Need an animation format AI can generate and programs can play
- **Content creators**: Batch-produce animated videos without learning animation software
- **Product / operations**: Quickly create in-app animations without waiting for designers
- **Teachers / science communicators**: Demonstrate algorithms, physics, math processes
- **Data analysts**: Turn data into animated chart videos

---

## License

MIT [LICENSE](LICENSE)

## Contributing

Issues and Pull Requests are welcome. See the [ToDo document](ToDo.md).

## Contact
---

Author

Xue Zicheng <xuezicheng842@outlook.com>

GitCode: https://gitcode.com/xzc842

---
