
# templates.md — 模板字段表

> 内置模板的完整字段说明。

---

## 目录

1. [dialog — 对话气泡](#1-dialog--对话气泡)
2. [card — 卡片弹出](#2-card--卡片弹出)
3. [设计自定义模板](#3-设计自定义模板)

---

## 1. dialog — 对话气泡

从侧边滑入的对话气泡，支持头像、说话人、打字机效果。

### 字段

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `at` | coord | 否 | `[100, 200]` | 气泡锚点 |
| `text` | string | **是** | `""` | 对话内容 |
| `speaker` | string | 否 | `""` | 说话人名字 |
| `side` | enum | 否 | `"left"` | `left` \| `right` |
| `theme` | enum | 否 | `"light"` | `light` \| `dark` \| `primary` |
| `typing` | boolean | 否 | `false` | 打字机效果 |
| `duration` | number | 否 | `2500` | 停留时长(ms) |
| `width` | number | 否 | `320` | 气泡最大宽度 |
| `avatar` | string | 否 | `""` | 头像图片路径 |
| `delay` | number | 否 | `0` | 开始前延迟(ms) |
| `time` | number | 否 | `null` | 绝对开始时间(ms) |

### `side` 效果

| 值 | 气泡方向 | 头像位置 |
|----|----------|----------|
| `left` | 从左侧滑入，气泡向右展开 | 头像在左 |
| `right` | 从右侧滑入，气泡向左展开 | 头像在右 |

### `theme` 配色

| 值 | 背景 | 边框 | 文字 | 说话人 |
|----|------|------|------|--------|
| `light` | `#ffffff` | `#e2e8f0` | `#1e293b` | `#64748b` |
| `dark` | `#1e293b` | `#334155` | `#f1f5f9` | `#94a3b8` |
| `primary` | `#4f46e5` | `#4338ca` | `#ffffff` | `#c7d2fe` |

### 示例

**最简：**

```
dialog { at = [200, 200], text = "你好" }
```

**带头像和说话人：**

```
dialog {
  at = [200, 200],
  speaker = "张三",
  text = "你好，世界",
  avatar = "avatars/zhangsan.png",
  side = "left"
}
```

**打字机效果：**

```
dialog {
  at = [200, 200],
  text = "这句话会逐字出现",
  typing = true,
  theme = "primary",
  duration = 3000
}
```

**双方对话：**

```
dialog { at = [150, 200], side = "left",  text = "你吃饭了吗" }
dialog { at = [600, 200], side = "right", text = "吃了" }
```

### 内部动画分解

```
0ms        气泡从侧边滑入 (320ms, easeOut) + 淡入
100ms      说话人名字淡入 (260ms)
200ms      正文淡入 (280ms)
           typing=true 时改为逐字 fade in
80ms       头像淡入 (300ms)
duration   气泡 + 名字 + 正文 + 头像淡出 (280ms, easeIn)
```

---

## 2. card — 卡片弹出

从中心缩放/滑入的卡片，支持图标、图片、标题、副标题。

### 字段

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `at` | coord | 否 | `[400, 300]` | 卡片中心 |
| `title` | string | **是** | `""` | 主标题 |
| `subtitle` | string | 否 | `""` | 副标题 |
| `icon` | string | 否 | `""` | emoji 或文字 |
| `image` | string | 否 | `""` | 图片路径（优先于 icon） |
| `accent` | string | 否 | `"#4f46e5"` | 主题色 |
| `duration` | number | 否 | `3000` | 停留时长(ms) |
| `width` | number | 否 | `360` | 卡片宽度 |
| `height` | number | 否 | `200` | 卡片高度 |
| `entrance` | enum | 否 | `"scale"` | `scale` \| `slideUp` \| `flip` |
| `delay` | number | 否 | `0` | 开始前延迟(ms) |
| `time` | number | 否 | `null` | 绝对开始时间(ms) |

### `entrance` 入场方式

| 值 | 效果 |
|----|------|
| `scale` | 从 0.8 倍缩放到 1 倍 |
| `slideUp` | 从下方 60px 滑入 |
| `flip` | 从 0.6 倍缩放到 1 倍（更明显） |

### 图标 vs 图片

- 同时给 `icon` 和 `image`，**`image` 优先**
- `icon` 用 emoji（如 `"✅"`）或单字符
- `image` 是路径，显示为 56x56 的图片

### 示例

**最简：**

```
card { at = [400, 300], title = "完成" }
```

**带副标题和图标：**

```
card {
  at = [400, 300],
  title = "订单已创建",
  subtitle = "#12345",
  icon = "✅",
  accent = "#10b981"
}
```

**带图片：**

```
card {
  at = [400, 300],
  title = "成就解锁",
  subtitle = "连续签到 7 天",
  image = "badges/7days.png",
  accent = "#f59e0b",
  entrance = "flip"
}
```

**从下方滑入：**

```
card {
  at = [400, 300],
  title = "新消息",
  icon = "📬",
  entrance = "slideUp",
  duration = 2500
}
```

### 内部动画分解

```
0ms        卡片从入场状态 (420ms, easeOutBack) + 淡入
120ms      顶部色条淡入 (260ms)
220ms      图标/图片淡入 (320ms, easeOutBack)
360ms      标题淡入 + 上滑 (320ms)
500ms      副标题淡入 + 上滑 (320ms)
duration   卡片 + 色条 + 内容淡出 (300ms, easeIn)
           卡片轻微缩小到 0.96
```

---

## 3. 设计自定义模板

模板是纯数据，不是代码逻辑。

### 结构

```js
export default {
  name: "myTemplate",
  fields: {
    at:       { type: "coord",  default: [100, 100] },
    text:     { type: "string", required: true },
    color:    { type: "string", default: "#4f46e5" },
    duration: { type: "number", default: 2000 },
    mode:     { type: "enum",   values: ["a", "b"], default: "a" },
  },
  build(params, ctx) {
    const { at, text, color, duration } = params;
    const startTime = ctx.time;

    return {
      actions: [
        // 只用 7 种原子动作：create / move / scale / rotate / fade / wait / tag
        { type: "create", shape: "rect", id: "box", at, params: {...}, time: startTime },
        { type: "fade", target: "box", params: { to: 1 }, time: startTime, duration: 300 },
      ],
      endTime: startTime + duration,
    };
  },
};
```

### 字段类型

| type | 说明 | 示例值 |
|------|------|--------|
| `coord` | `[x, y]` 数组 | `[100, 200]` |
| `string` | 字符串 | `"hello"` |
| `number` | 数字 | `2500` |
| `boolean` | 布尔 | `true` |
| `enum` | 枚举 | `"left"` / `"right"` |

### 关键约束

1. **只能输出 7 种原子动作**：`create` / `move` / `scale` / `rotate` / `fade` / `wait` / `tag`
2. **不要发明新动作类型**
3. **`endTime` 必须返回**，编译器用它推进时间
4. **`params` 已经合并了 `fields` 里的默认值**，但为了保险，`build` 里可再兜底一次
5. **每个元素用唯一 id**，避免多个模板实例冲突

### 注册

```js
import { registerTemplate } from "svg-script-player";

registerTemplate("myTemplate", myTemplate);
```

或者实例级：

```js
player.registerTemplate("myTemplate", myTemplate);
```

### 调试

模板展开后的动作队列可用：

```js
import { parseScript } from "svg-script-player";
import { expandDefs } from "svg-script-player";
import { compile } from "svg-script-player";

const ast = parseScript(source);
const expanded = expandDefs(ast);
const { actions } = compile(expanded, { templates: { myTemplate } });
console.log(actions);
```

看生成的原子动作是否符合预期。

---

## 附录：字段默认值处理

**两层保险：**

1. **编译器**：`compileTemplate` 用 `applyTemplateDefaults` 把 `fields` 的默认值合并进 `params`
2. **模板内部**：`build` 里对每个字段兜底

```js
build(params, ctx) {
  const {
    at = [100, 100],
    text = "",
    duration = 2000,
  } = params;
  // ...
}
```

即使编译器没合并默认值，模板也不会 NaN。

---

## 文档版本

- 版本：0.1.0
- 更新：随包版本同步

相关文档：
- `docs/syntax.md` — 脚本语法
- `docs/api.md` — JS API
- `docs/ai-prompt.md` — 给 AI 的提示词（待写）