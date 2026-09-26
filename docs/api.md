# api.md — JS API 文档

> SVG Script Player 的 JavaScript 接口。

---

## 目录

1. [安装与引入](#1-安装与引入)
2. [创建播放器](#2-创建播放器)
3. [加载脚本](#3-加载脚本)
4. [播放控制](#4-播放控制)
5. [状态查询](#5-状态查询)
6. [事件监听](#6-事件监听)
7. [插槽 API](#7-插槽-api)
8. [模板 API](#8-模板-api)
9. [Node 渲染 API](#9-node-渲染-api)
10. [错误处理](#10-错误处理)
11. [完整 TypeScript 类型](#11-完整-typescript-类型)

---

## 1. 安装与引入

### 浏览器（CDN）

```html
<script src="https://unpkg.com/svg-script-player"></script>
<script>
  const player = new SVGScriptPlayer({ container: "#stage" });
</script>
```

### 浏览器（打包器）

```js
import SVGScriptPlayer from "svg-script-player";
```

### Node（渲染视频）

```js
import {
  SVGScriptNodePlayer,
  renderVideo,
  renderBatch,
  renderScriptToVideo,
} from "svg-script-player/node";
```

---

## 2. 创建播放器

### 浏览器

```js
const player = new SVGScriptPlayer({
  container: "#stage",         // 挂载点，必填，CSS 选择器或 HTMLElement
  basePath: "./scripts/",      // import 和 loadFile 的相对根
  speed: 1.0,                  // 初始播放速度
  config: {                    // 覆盖脚本里的 config
    size: [800, 600],
    background: "#ffffff",
  },
  templates: {},               // 额外注册的模板
  loadFile: async (path) => {...},  // 自定义加载器（可选）
});
```

### Node

```js
const player = new SVGScriptNodePlayer({
  basePath: process.cwd(),
  config: { size: [1920, 1080] },
  templates: {},
  loadFile: async (path) => {...},
});
```

### 配置项

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `container` | `string \| HTMLElement` | — | 挂载点，浏览器必填 |
| `basePath` | `string` | `""` | 相对路径根 |
| `speed` | `number` | `1.0` | 初始速度 |
| `config` | `object` | `{}` | 覆盖脚本 config |
| `templates` | `object` | `{}` | 额外模板 |
| `loadFile` | `function` | 默认实现 | 自定义文件加载器 |
| `mode` | `"dom" \| "node"` | 自动 | 由入口决定 |

---

## 3. 加载脚本

### `player.load(source)`

从字符串加载脚本。

```js
await player.load(`
  config { size = 800x600 }
  circle { at = [400, 300], r = 50 }
`);
```

**返回**：`Promise<void>`

### `player.loadFile(path)`

从文件加载。浏览器用 fetch，Node 用 fs。

```js
await player.loadFile("intro.txt");
```

**返回**：`Promise<void>`

**注意**：路径相对于 `basePath`。

---

## 4. 播放控制

### `player.play()`

开始或继续播放。如果已播完，从头开始。

```js
player.play();
```

### `player.pause()`

暂停。

```js
player.pause();
```

### `player.toggle()`

切换播放/暂停。

```js
player.toggle();
```

### `player.stop()`

停止并回到开头。

```js
player.stop();
```

### `player.reset()`

重置到初始状态（清空元素、清空插槽、回到 0ms）。

```js
player.reset();
```

### `player.seek(ms)`

跳到指定时间点。

```js
player.seek(2500);   // 跳到 2500ms
```

### `player.seekTag(name)`

跳到指定 tag。

```js
player.seekTag("scene2");
```

### `player.seekPercent(p)`

跳到百分比位置。

```js
player.seekPercent(0.5);   // 跳到 50%
```

### `player.setSpeed(speed)`

设置播放速度。播放中调用不跳帧。

```js
player.setSpeed(1.5);   // 1.5 倍速
player.setSpeed(0.5);   // 半速
```

---

## 5. 状态查询

| 方法 | 返回 | 说明 |
|------|------|------|
| `player.getDuration()` | `number` | 总时长(ms) |
| `player.getCurrentTime()` | `number` | 当前时间(ms) |
| `player.getProgress()` | `number` | 0~1 |
| `player.isPlayingState()` | `boolean` | 是否播放中 |
| `player.isLoaded()` | `boolean` | 是否已加载 |
| `player.getSpeed()` | `number` | 当前速度 |
| `player.getTags()` | `string[]` | 所有 tag 名 |
| `player.getTagTime(name)` | `number \| undefined` | tag 对应时间 |
| `player.getSceneSnapshot()` | `object` | 当前场景快照 |

### `getSceneSnapshot()`

返回当前画布状态，供 AI 或调试使用。

```js
{
  currentTime: 2500,
  isPlaying: true,
  duration: 9000,
  tags: ["start", "middle", "end"],
  slots: [
    {
      id: "quiz1",
      at: [200, 250],
      w: 400,
      h: 200,
      html: "<button>选项 A</button>"
    }
  ]
}
```

---

## 6. 事件监听

### `player.on(event, handler)`

注册事件监听。

```js
player.on("play", () => console.log("开始播放"));
player.on("tag", (name, time) => console.log("到达:", name));
```

**返回**：`() => void` 取消函数

### `player.off(event, handler)`

移除监听。

```js
const handler = () => {};
player.on("tag", handler);
player.off("tag", handler);
```

### `player.once(event, handler)`

只触发一次。

```js
player.once("complete", () => console.log("播完了"));
```

### 事件列表

| 事件 | 参数 | 说明 |
|------|------|------|
| `load` | `{ duration, config }` | 脚本加载完成 |
| `play` | — | 开始播放 |
| `pause` | — | 暂停 |
| `stop` | — | 停止 |
| `reset` | — | 重置 |
| `seek` | `time` | 跳转 |
| `timeupdate` | `time, progress` | 每帧触发 |
| `complete` | — | 播放结束 |
| `tag` | `name, time` | 到达 tag |
| `slot` | `event` | 插槽事件 |

---

## 7. 插槽 API

插槽是脚本里 `div` 指令创建的可交互区域，能嵌入任意 HTML。

### 脚本侧

```
div {
  at = [200, 250],
  w = 400,
  h = 200,
  id = "quiz1"
}
```

### `player.getSlot(id)`

获取插槽句柄。

```js
const slot = player.getSlot("quiz1");
```

**返回**：

```js
{
  id: "quiz1",
  setHTML: (html) => void,
  emit: (type, payload) => void
}
```

### `slot.setHTML(html)`

往插槽里塞 HTML。

```js
slot.setHTML(`
  <p>1 + 1 = ?</p>
  <button data-event="click" data-value="A">A. 1</button>
  <button data-event="click" data-value="B">B. 2</button>
`);
```

**约定**：带 `data-event` 属性的元素会自动绑定事件。

### `slot.emit(type, payload)`

手动触发事件。

```js
slot.emit("custom", { score: 95 });
```

### `player.setSlotHTML(id, html)`

简化写法。

```js
player.setSlotHTML("quiz1", "<button>确定</button>");
```

### 插槽事件格式

监听 `slot` 事件拿到：

```js
player.on("slot", (event) => {
  console.log(event);
});

// {
//   type: "slot:click",
//   slotId: "quiz1",
//   elementId: null,
//   payload: { value: "A", text: "A. 1", key: null },
//   timestamp: 1712345678901
// }
```

| 字段 | 说明 |
|------|------|
| `type` | `slot:click` / `slot:input` / `slot:change` / `slot:submit` |
| `slotId` | 哪个插槽 |
| `elementId` | 触发元素的 id（可选） |
| `payload` | `{ value, text, key }` |
| `timestamp` | 时间戳 |

### AI 闭环示例

```js
player.on("slot", async (event) => {
  if (event.slotId === "quiz1") {
    const answer = event.payload.value;
    const response = await ai.chat({
      role: "user",
      content: `用户选择了 ${answer}`,
      context: player.getSceneSnapshot()
    });
    await player.load(response.script);
    player.play();
  }
});
```

---

## 8. 模板 API

### `registerTemplate(name, tpl)`

注册模板，可全局或局部。

```js
import { registerTemplate } from "svg-script-player";

registerTemplate("myTemplate", {
  name: "myTemplate",
  fields: {
    at: { type: "coord", default: [100, 100] },
    text: { type: "string", required: true },
    duration: { type: "number", default: 2000 }
  },
  build(params, ctx) {
    return {
      actions: [
        // 返回原子动作
      ],
      endTime: ctx.time + params.duration
    };
  }
});
```

### 实例级注册

```js
player.registerTemplate("myTemplate", tpl);
```

### 模板对象结构

```js
{
  name: "dialog",
  fields: {
    at:       { type: "coord",  default: [100, 200] },
    text:     { type: "string", required: true },
    side:     { type: "enum",   values: ["left", "right"], default: "left" },
    duration: { type: "number", default: 2500 }
  },
  build(params, ctx) {
    // params: 合并了默认值的参数
    // ctx: { time, config, elements, lastPosition }
    return {
      actions: [
        { type: "create", shape: "rect", id: "x", at: [0,0], params: {...}, time: 0 },
        { type: "fade", target: "x", params: { to: 1 }, time: 0, duration: 300 },
      ],
      endTime: 2500
    };
  }
}
```

### 字段类型

| type | 说明 |
|------|------|
| `coord` | `[x, y]` 数组 |
| `string` | 字符串 |
| `number` | 数字 |
| `boolean` | 布尔 |
| `enum` | 枚举，需 `values` |

---

## 9. Node 渲染 API

### `renderScriptToVideo(options)`

一行出片：加载脚本 + 渲染视频。

```js
import { renderScriptToVideo } from "svg-script-player/node";

await renderScriptToVideo({
  scriptFile: "./intro.txt",   // 或 script: "..."
  output: "./out/intro.mp4",

  fps: 30,
  width: 1280,
  height: 854,

  format: "mp4",               // mp4 | webm | gif | mov
  codec: "h264",               // h264 | h265 | vp9 | gif
  quality: 23,                 // CRF，越小越好
  bitrate: "5M",               // 或指定码率

  range: [0, 5000],            // 只渲染 0~5 秒
  engine: "resvg",             // resvg | sharp
  ffmpegPath: "/usr/bin/ffmpeg",

  onProgress: (frame, total) => {},
  onFrame: (pngBuffer, i, total) => {},
});
```

**返回**：

```js
{ output: "out.mp4", frames: 281, duration: 9366 }
```

### `renderVideo(options)`

传入已加载的 player。

```js
import { SVGScriptNodePlayer, renderVideo } from "svg-script-player/node";

const player = new SVGScriptNodePlayer();
await player.load(source);
await renderVideo({ player, output: "out.mp4", fps: 30 });
```

### `renderBatch(jobs, defaults)`

批量渲染，支持并发。

```js
import { renderBatch } from "svg-script-player/node";

const results = await renderBatch([
  { scriptFile: "./a.txt", output: "./a.mp4" },
  { scriptFile: "./b.txt", output: "./b.mp4" },
], {
  fps: 30,
  width: 1920,
  height: 1080,
  concurrency: 2,
});
```

**返回**：

```js
[
  { status: "ok", output: "./a.mp4", frames: 281, duration: 9366 },
  { status: "error", output: "./b.mp4", error: "..." }
]
```

### `svgToPng(svg, options)`

SVG 字符串 → PNG Buffer。

```js
import { svgToPng } from "svg-script-player/node";

const png = await svgToPng(svgString, {
  engine: "resvg",
  width: 1920,
  height: 1080
});
```

---

## 10. 错误处理

所有错误继承自 `SVGScriptError`：

```js
import { SVGScriptError } from "svg-script-player";

try {
  await player.load(source);
} catch (err) {
  if (err instanceof SVGScriptError) {
    console.log(err.type);   // "parse" | "compile" | "runtime" | "import"
    console.log(err.file);   // 文件路径
    console.log(err.line);   // 行号
    console.log(err.column); // 列号
    console.log(err.message);
  }
}
```

### 错误类型

| 类型 | 触发时机 |
|------|----------|
| `ParseError` | 语法错误 |
| `CompileError` | 编译错误（未知指令、缺参数） |
| `RuntimeError` | 运行时错误 |
| `ImportError` | import 失败、循环引用 |

### 结构化错误（面向 AI）

```js
err.toJSON();
// {
//   name: "CompileError",
//   message: "未知指令: dot",
//   file: "inline",
//   line: 12,
//   column: null,
//   type: "compile"
// }
```

---

## 11. 完整 TypeScript 类型

```ts
interface PlayerOptions {
  container?: string | HTMLElement;
  basePath?: string;
  speed?: number;
  config?: Partial<ScriptConfig>;
  templates?: Record<string, Template>;
  loadFile?: (path: string) => Promise<string>;
  mode?: "dom" | "node";
}

interface ScriptConfig {
  size: [number, number];
  background: string;
  loop: boolean;
  speed: number;
  defaultEasing: string;
}

interface Template {
  name: string;
  fields: Record<string, TemplateField>;
  build(params: any, ctx: BuildContext): TemplateResult;
}

interface TemplateField {
  type: "coord" | "string" | "number" | "boolean" | "enum";
  default?: any;
  required?: boolean;
  values?: string[];
}

interface BuildContext {
  time: number;
  config: ScriptConfig;
  elements: Map<string, any>;
  lastPosition: [number, number] | null;
}

interface TemplateResult {
  actions: Action[];
  endTime: number;
}

interface SlotEvent {
  type: string;
  slotId: string;
  elementId: string | null;
  payload: {
    value: any;
    text: string | null;
    key: string | null;
  };
  timestamp: number;
}

interface RenderOptions {
  script?: string;
  scriptFile?: string;
  output: string;
  fps?: number;
  width?: number;
  height?: number;
  format?: "mp4" | "webm" | "gif" | "mov";
  codec?: "h264" | "h265" | "vp9" | "gif";
  quality?: number;
  bitrate?: string;
  range?: [number, number];
  engine?: "resvg" | "sharp";
  ffmpegPath?: string;
  onProgress?: (frame: number, total: number) => void;
  onFrame?: (png: Buffer, i: number, total: number) => void;
}

interface RenderResult {
  output: string;
  frames: number;
  duration: number;
}

declare class SVGScriptPlayer {
  constructor(options: PlayerOptions);

  // 加载
  load(source: string): Promise<void>;
  loadFile(path: string): Promise<void>;

  // 播放控制
  play(): void;
  pause(): void;
  toggle(): void;
  stop(): void;
  reset(): void;
  seek(ms: number): void;
  seekTag(name: string): void;
  seekPercent(p: number): void;
  setSpeed(speed: number): void;
  getSpeed(): number;

  // 状态
  getDuration(): number;
  getCurrentTime(): number;
  getProgress(): number;
  isPlayingState(): boolean;
  isLoaded(): boolean;
  getTags(): string[];
  getTagTime(name: string): number | undefined;
  getSceneSnapshot(): object;

  // 事件
  on(event: string, handler: Function): () => void;
  off(event: string, handler: Function): void;
  once(event: string, handler: Function): void;

  // 插槽
  getSlot(id: string): {
    id: string;
    setHTML(html: string): void;
    emit(type: string, payload: any): void;
  } | null;
  setSlotHTML(id: string, html: string): void;

  // 模板
  registerTemplate(name: string, tpl: Template): void;

  // 销毁
  destroy(): void;
}
```

---