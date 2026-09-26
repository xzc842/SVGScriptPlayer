# SVG Script Player
[![npm version](https://img.shields.io/npm/v/svg-script-player.svg)](https://www.npmjs.com/package/svg-script-player)
[![npm downloads](https://img.shields.io/npm/dm/svg-script-player.svg)](https://www.npmjs.com/package/svg-script-player)
[![license](https://img.shields.io/npm/l/svg-script-player.svg)](https://github.com/xzc842/SVGScriptPlayer/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/xzc842/SVGScriptPlayer.svg?style=social)](https://github.com/xzc842/SVGScriptPlayer)
> 用文本脚本描述 SVG 动画和交互场景的运行时。

一个用**结构化文本**描述动画的脚本语言 + 播放器 + 渲染器。

- **写动画** → 用文本写，像写配置一样简单
- **AI 生成** → 线性语法，LLM 友好，可逐行校验
- **浏览器播放** → 实时渲染，支持事件回调
- **Node 出片** → FFmpeg 渲染成 MP4 / GIF / 序列帧
- **可交互** → `div` 插槽嵌入 HTML，事件回流给 AI

```
dialog {
  at = [300, 200],
  speaker = "系统",
  text = "你好，世界",
  typing = true
}
```

三行，一个带打字机效果的对话气泡。

---

## 为什么

现在的 AI 能生成代码、文字、图片，但**生成"可播放的动画"一直很难**：

- 生成 SVG + JS 代码 → 容易生成无法运行的结果，不可校验
- 用 Lottie / Rive → 二进制格式，AI 无法直接生成
- 用 After Effects → 专有格式，非文本

**SVG Script Player 把动画降级成结构化文本**：

```
脚本 → 解析 → 编译 → 渲染
```

每一步都可校验、可定位、可修正。这是 **AI 生成动画的最后一块拼图**。

---

## 特性

| 特性 | 说明 |
|------|------|
| 📝 **文本脚本** | 线性、自解释、可逐行校验 |
| 🎬 **浏览器实时播放** | 支持播放/暂停/跳转/调速 |
| 🎥 **Node 渲染视频** | FFmpeg 出 MP4 / WebM / GIF / PNG 序列 |
| 🧩 **预制模板** | `dialog`、`card`，可扩展 |
| 🎯 **tag 锚点** | JS 跳转、事件监听 |
| 🖼 **div 插槽** | 嵌入任意 HTML，事件回调 |
| 🔄 **AI 闭环** | 事件结构化回传，AI 生成下一步 |
| 🧬 **def 宏** | 定义可复用片段 |
| 📦 **import** | 多文件组合 |

---

## 安装

```bash
npm install svg-script-player
```

**Node 渲染视频**额外需要：

```bash
npm install ffmpeg-static    # 可选，没装就用系统 ffmpeg
npm install sharp            # 可选，替代渲染引擎
```

---

## 快速开始

### 浏览器

```html
<div id="stage"></div>

<script type="module">
  import { SVGScriptPlayer } from "svg-script-player";

  const player = new SVGScriptPlayer({ container: "#stage" });

  await player.load(`
    config { size = 800x600, background = "#0f172a" }

    circle { at = [400, 300], r = 50, fill = "#4f46e5", name = "dot" }

    move { target = "dot", to = [600, 300], duration = 800 }

    dialog {
      at = [200, 500],
      text = "移动完成",
      speaker = "系统"
    }
  `);

  player.play();
</script>
```

### Node 渲染视频

```js
import { renderScriptToVideo } from "svg-script-player/node";

await renderScriptToVideo({
  scriptFile: "./intro.txt",
  output: "./out/intro.mp4",
  fps: 30,
  width: 1920,
  height: 1080,
  onProgress: (i, total) => {
    process.stdout.write(`\r渲染 ${i}/${total}`);
  },
});
```

### CDN

```html
<script src="https://unpkg.com/svg-script-player/dist/svg-script-player.umd.js"></script>
<script>
  const { SVGScriptPlayer } = SVGScriptPlayerLib;
  const player = new SVGScriptPlayer({ container: "#stage" });
  player.load(script).then(() => player.play());
</script>
```

> UMD 全局变量名是 `SVGScriptPlayerLib`，通过解构拿到 `SVGScriptPlayer` 类。

---

## 脚本示例

```
# ============================================
# 三个圆依次弹跳 + 对话 + 卡片
# ============================================

config {
  size = 900x600,
  background = "#0f172a",
  defaultEasing = "easeOut"
}

# 定义宏
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

# 三个圆并行出现
group {
  at = [250, 250],
  children = [
    dot { at = [0, 0],   color = "#4f46e5", r = 40, name = "a" },
    dot { at = [200, 0], color = "#ef4444", r = 40, name = "b" },
    dot { at = [400, 0], color = "#10b981", r = 40, name = "c" }
  ]
}

# 依次弹跳
move { target = "a", to = [250, 220], duration = 200 }
move { target = "a", to = [250, 250], duration = 200 }
move { target = "b", to = [450, 220], duration = 200 }
move { target = "b", to = [450, 250], duration = 200 }
move { target = "c", to = [650, 220], duration = 200 }
move { target = "c", to = [650, 250], duration = 200 }

# 对话
dialog {
  at = [120, 380],
  speaker = "系统",
  text = "三个圆都跳完了",
  side = "left",
  duration = 2200
}

dialog {
  at = [520, 380],
  speaker = "用户",
  text = "看起来不错",
  side = "right",
  theme = "primary",
  typing = true,
  duration = 2200
}

# 卡片
card {
  at = [450, 220],
  title = "演示完成",
  subtitle = "共 3 个圆 · 2 段对话 · 1 张卡片",
  icon = "✅",
  accent = "#10b981",
  duration = 3000
}

tag { name = "end" }
```

**运行这个脚本** → 三个圆出现、弹跳、两段对话、卡片弹出。

---

## 脚本语法速览

### 语句格式

```
指令名  { 参数 }
```

### 位置

```
at = [100, 200]       绝对
at = [+50, -30]       相对
at = "@dot"           引用命名元素
at = "_"              沿用上一条
```

### 原子指令

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

### 控制指令

```
config  { size, background, loop, speed, defaultEasing }
group   { at, children }
```

### 模板指令

```
dialog  { at, text, speaker, side, theme, typing, duration, avatar }
card    { at, title, subtitle, icon, image, accent, duration, entrance }
```

### 复用

```
def 名称(参数) {
  指令 { ... @参数 ... }
}

import "other.txt"
```

完整语法见 [`docs/syntax.md`](docs/syntax.md)。

---

## JS API

### 加载与播放

```js
import { SVGScriptPlayer } from "svg-script-player";

const player = new SVGScriptPlayer({ container: "#stage" });

await player.load(scriptText);         // 从字符串
await player.loadFile("intro.txt");    // 从文件

player.play();
player.pause();
player.toggle();
player.reset();
player.seek(2500);                     // 跳到 2500ms
player.seekTag("middle");              // 跳到 tag
player.setSpeed(1.5);
```

### 状态查询

```js
player.getDuration();       // 总时长(ms)
player.getCurrentTime();    // 当前时间
player.getProgress();       // 0~1
player.isPlayingState();
player.getTags();           // tag 列表
player.getSceneSnapshot();  // 当前场景快照
```

### 事件

```js
player.on("play", () => {});
player.on("pause", () => {});
player.on("complete", () => {});
player.on("tag", (name, time) => {});
player.on("timeupdate", (time, progress) => {});
player.on("slot", (event) => {});
```

完整 API 见 [`docs/api.md`](docs/api.md)。

---

## 插槽与 AI 闭环

脚本里的 `div` 指令创建可交互区域：

```
dialog { at = [300,200], text = "你选 A 还是 B？" }

div {
  at = [200, 320],
  w = 400,
  h = 100,
  id = "quiz1"
}
```

JS 侧塞 HTML：

```js
import { SVGScriptPlayer } from "svg-script-player";

const player = new SVGScriptPlayer({ container: "#stage" });

// 示例：AI 应用程序
player.getSlot("quiz1").setHTML(`
  <button data-event="click" data-value="A">A</button>
  <button data-event="click" data-value="B">B</button>
`);

player.on("slot", async (event) => {
  if (event.slotId === "quiz1") {
    const answer = event.payload.value;

    // 回传给 AI
    const response = await ai.chat({
      role: "user",
      content: `用户选择了 ${answer}`,
      context: player.getSceneSnapshot(),
    });

    // AI 生成新脚本
    await player.load(response.script);
    player.play();
  }
});
```

**这是 AI 控制用户界面的基础**：AI 生成场景 → 用户操作 → 事件回流 → AI 生成下一步。

---

## Node 渲染

### 单个渲染

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

### 批量渲染

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

### 导出序列帧

```js
import { SVGScriptNodePlayer, svgToPng } from "svg-script-player/node";
import fs from "node:fs/promises";

const player = new SVGScriptNodePlayer();
await player.loadFile("./intro.txt");

for (let i = 0; i < totalFrames; i++) {
  player.seek(i * 1000 / 30);
  const svg = player.renderer.serialize();
  const png = await svgToPng(svg, { width: 1920, height: 1080 });
  await fs.writeFile(`frames/${i}.png`, png);
}
```

### 已加载 player 渲染

```js
import { SVGScriptNodePlayer, renderVideo } from "svg-script-player/node";

const player = new SVGScriptNodePlayer();
await player.load(source);
await renderVideo({ player, output: "out.mp4", fps: 30 });
```

---

## 模板

内置模板：

| 模板 | 用途 |
|------|------|
| `dialog` | 对话气泡（带头像/打字机） |
| `card` | 卡片弹出（图标/主题色/入场） |

用法：

```
dialog { at = [200, 200], text = "你好", typing = true }
card   { at = [400, 300], title = "完成", accent = "#10b981" }
```

自定义模板：

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

详见 [`docs/templates.md`](docs/templates.md)。

---

## 文档

| 文档 | 内容 |
|------|------|
| [`docs/syntax.md`](docs/syntax.md) | 脚本语法完整说明 |
| [`docs/api.md`](docs/api.md) | JS API |
| [`docs/templates.md`](docs/templates.md) | 模板字段表与自定义 |
| [`docs/ai-prompt.md`](docs/ai-prompt.md) | 给 AI 的提示词模板 |

---

## 开发

```bash
# 安装依赖
npm install
# 构建
npm run build
```

---

## 架构

```
             脚本 (.txt)
                ↓
        ┌───────────────┐
        │    parser     │  文本 → AST
        └───────────────┘
                ↓
        ┌───────────────┐
        │   importer    │  展开 import
        └───────────────┘
                ↓
        ┌───────────────┐
        │   expander    │  展开 def 宏
        └───────────────┘
                ↓
        ┌───────────────┐
        │   compiler    │  AST → 动作队列
        └───────────────┘
                ↓
        ┌───────────────┐
        │   timeline    │  时间轴 + tag 索引
        └───────────────┘
                ↓
        ┌───────────────┐         ┌──────────────┐
        │   renderer    │ ──────→ │  DOM (浏览器) │
        │               │         ├──────────────┤
        │               │ ──────→ │  String (Node)│
        └───────────────┘         └──────────────┘
                ↓                         ↓
        ┌───────────────┐         ┌──────────────┐
        │    player     │         │   FFmpeg     │
        │  播放控制      │         │   渲染视频    │
        └───────────────┘         └──────────────┘
```

**7 种原子动作**：`create` / `move` / `scale` / `rotate` / `fade` / `wait` / `tag`

**模板**：编译期展开成原子动作，不发明新动作类型。

---

## 谁需要使用：

- **AI 应用开发者**：需要一个 AI 能生成、程序能播放的动画格式
- **内容创作者**：批量做动画视频，但不想学动画软件
- **产品/运营**：快速做 App 内动画，不想等设计师
- **教师/科普作者**：演示算法、物理、数学过程
- **数据分析师**：把数据变成动态图表视频

---

## 开源许可

MIT [LICENSE](LICENSE)

## 贡献

欢迎提交 Issue 和 Pull Request。请参阅[ToDo文档](ToDo.md)

## 联系方式
---

作者

Xue Zicheng <xuezicheng842@outlook.com>

GitCode: https://gitcode.com/xzc842

---