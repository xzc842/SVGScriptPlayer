# SVG Script Player 脚本文档

> 一套用文本描述 SVG 动画和交互场景的脚本语言。

---

## 目录

1. [快速开始](#1-快速开始)
2. [脚本结构](#2-脚本结构)
3. [位置与坐标](#3-位置与坐标)
4. [原子指令](#4-原子指令)
5. [控制指令](#5-控制指令)
6. [模板指令](#6-模板指令)
7. [def 宏](#7-def-宏)
8. [import 文件](#8-import-文件)
9. [变量与表达式](#9-变量与表达式)
10. [时间控制](#10-时间控制)
11. [完整示例](#11-完整示例)
12. [语法速查](#12-语法速查)

---

## 1. 快速开始

一个最小脚本：

```
config {
  size = 800x600
}

circle {
  at = [400, 300],
  r = 50,
  fill = "#4f46e5"
}

dialog {
  at = [200, 400],
  text = "你好，世界"
}
```

把它保存为 `hello.txt`，用播放器加载即可看到：画布上出现一个紫圆，然后弹出一个对话气泡。

**三条规则：**

1. 每条指令格式为 `指令名 { 参数 }`
2. 参数用 `键 = 值`，逗号分隔
3. 坐标用 `[x, y]` 数组

---

## 2. 脚本结构

一个脚本文件由若干指令组成，按书写顺序执行。

### 2.1 注释

以 `#` 开头，可整行或行尾。

```
# 这是整行注释

circle {
  at = [100, 100],   # 这是行尾注释
  r = 40
}
```

### 2.2 参数格式

花括号内是参数列表，每项 `键 = 值`，逗号分隔。

**单行：**

```
circle { at = [100, 100], r = 40, fill = "red" }
```

**多行（推荐）：**

```
circle {
  at = [100, 100],
  r = 40,
  fill = "red"
}
```

两种写法完全等价。最后一项的逗号可以省略。

### 2.3 值类型

| 类型 | 写法 | 示例 |
|------|------|------|
| 数字 | 直接写 | `40`、`1.5` |
| 字符串 | 双引号或单引号 | `"red"`、`'left'` |
| 布尔 | `true` / `false` | `typing = true` |
| 数组 | 方括号 | `[100, 200]` |
| 颜色 | 字符串 | `"#4f46e5"`、`"red"` |
| 变量引用 | `@名字` | `@r`、`@color` |

---

## 3. 位置与坐标

### 3.1 `at` 参数

所有需要位置的指令都用 `at` 指定：

```
circle { at = [100, 100], r = 40 }
text   { at = [200, 50], content = "标题" }
```

`at` 是 `[x, y]` 数组。

### 3.2 相对坐标

`at` 和 `to` 支持以下写法：

| 写法 | 含义 | 示例 |
|------|------|------|
| `[100, 200]` | 绝对坐标 | `at = [100, 200]` |
| `[+50, -30]` | 相对上一元素偏移 | `at = [+50, 0]` |
| `"_"` | 沿用上一条位置 | `at = "_"` |
| `"@name"` | 引用命名元素位置 | `at = "@dot1"` |

**示例：**

```
circle { at = [100, 100], r = 40, name = "a" }
circle { at = [+150, 0], r = 40, name = "b" }   # 相对 a 向右 150
circle { at = "@a", r = 20, fill = "white" }    # 在 a 的位置画小圆
```

### 3.3 命名元素

给元素加 `name` 参数，后续可用 `@name` 引用其位置：

```
circle { at = [100, 100], r = 40, name = "dot" }

move { target = "dot", to = [300, 200] }   # 移动 dot
circle { at = "@dot", r = 10, fill = "white" }  # 在 dot 的位置画小圆
```

---

## 4. 原子指令

原子指令是脚本最底层的能力，共 **6 个创建 + 4 个变换 + 2 个控制**。

### 4.1 `circle` — 圆

```
circle {
  at = [x, y],           # 圆心，必填
  r = 40,                # 半径，默认 10
  fill = "#4f46e5",      # 填充色，默认 "none"
  stroke = "#fff",       # 描边色
  stroke-width = 2,      # 描边宽度
  opacity = 1,           # 透明度
  name = "dot"           # 命名（可选）
}
```

### 4.2 `rect` — 矩形

```
rect {
  at = [x, y],           # 左上角，必填
  w = 100,               # 宽，默认 50
  h = 60,                # 高，默认 50
  rx = 8,                # 圆角半径
  ry = 8,
  fill = "#fff",
  stroke = "#ccc",
  stroke-width = 1,
  opacity = 1,
  name = "card"
}
```

### 4.3 `line` — 线

```
line {
  at = [x1, y1],         # 起点，必填
  to = [x2, y2],         # 终点，必填
  stroke = "#333",       # 默认 "#000"
  stroke-width = 2,
  stroke-dasharray = "5 5",
  stroke-linecap = "round",
  opacity = 1,
  name = "axis"
}
```

### 4.4 `text` — 文字

```
text {
  at = [x, y],           # 基线起点，必填
  content = "你好",       # 内容，必填
  size = 16,             # 字号，默认 16
  color = "#000",        # 颜色
  anchor = "middle",     # start | middle | end，默认 start
  weight = 600,          # 字重
  family = "sans-serif", # 字体
  opacity = 1,
  name = "title"
}
```

### 4.5 `image` — 图片

```
image {
  at = [x, y],           # 左上角，必填
  src = "path/to.png",   # 路径或 URL，必填
  w = 100,               # 宽度，默认原图宽
  h = 100,               # 高度
  preserveAspectRatio = "xMidYMid meet",
  opacity = 1,
  name = "avatar"
}
```

### 4.6 `path` — 路径

```
path {
  at = [x, y],           # 起点偏移
  d = "M0,0 L100,100",   # SVG path 数据，必填
  fill = "none",
  stroke = "#333",
  stroke-width = 2,
  opacity = 1,
  name = "shape"
}
```

### 4.7 `move` — 移动

```
move {
  target = "dot",        # 目标元素的 name，必填
  to = [x, y],           # 目标位置，必填
  duration = 500,        # 动画时长(ms)，默认 0
  easing = "easeOut",    # 缓动函数
  delay = 0,             # 开始前延迟
  time = null            # 绝对开始时间
}
```

### 4.8 `scale` — 缩放

```
scale {
  target = "card",       # 必填
  factor = 1.5,          # 缩放倍数，默认 1
  duration = 300,
  easing = "easeOutBack",
  delay = 0,
  time = null
}
```

缩放以元素中心为原点。

### 4.9 `rotate` — 旋转

```
rotate {
  target = "arrow",
  angle = 45,            # 角度
  duration = 400,
  easing = "easeInOut",
  delay = 0,
  time = null
}
```

以元素中心为原点。

### 4.10 `fade` — 淡入淡出

```
fade {
  target = "dot",
  to = 0,                # 目标透明度 0~1，默认 1
  duration = 400,
  easing = "easeOut",
  delay = 0,
  time = null
}
```

### 4.11 `wait` — 等待

```
wait { ms = 500 }
```

不渲染任何东西，只推进时间。常用于场景之间的间隔。

### 4.12 `tag` — 时间标记

```
tag { name = "scene1" }
```

时间轴上的锚点。JS 侧可以 `seekTag("scene1")` 跳转，或 `on("tag", ...)` 监听。

---

## 5. 控制指令

### 5.1 `config` — 全局配置

整个脚本只能有一个，通常写在最前面。

```
config {
  size = "900x600",       # 画布尺寸，字符串或数组 [w, h]
  background = "#0f172a", # 背景色
  loop = false,           # 是否循环
  speed = 1.0,            # 全局速度倍率
  defaultEasing = "easeOut"  # 默认缓动
}
```

### 5.2 `group` — 并行组

组内所有子指令**同时开始**。子指令的 `at` 相对组的 `at`。

```
group {
  at = [250, 250],
  delay = 0,
  children = [
    circle { at = [0, 0],   r = 30, fill = "red" },
    circle { at = [60, 0],  r = 30, fill = "green" },
    circle { at = [120, 0], r = 30, fill = "blue" }
  ]
}
```

组内可以嵌套组，也可以调用模板和 def。

---

## 6. 模板指令

模板是预制的复杂动画，用起来和原子指令一样，只是内部自动展开成多个原子动作。

### 6.1 `dialog` — 对话气泡

```
dialog {
  at = [120, 380],          # 气泡锚点，默认 [100, 200]
  text = "你好",             # 内容，必填
  speaker = "张三",          # 说话人名字
  side = "left",            # left | right，默认 left
  theme = "light",          # light | dark | primary，默认 light
  typing = false,           # 打字机效果，默认 false
  duration = 2500,          # 停留时长(ms)，默认 2500
  width = 320,              # 气泡最大宽度
  avatar = "avatar.png",    # 头像路径
  delay = 0,
  time = null
}
```

### 6.2 `card` — 卡片弹出

```
card {
  at = [400, 300],          # 卡片中心，默认 [400, 300]
  title = "完成",            # 标题，必填
  subtitle = "已保存",       # 副标题
  icon = "✅",               # emoji 或文字
  image = "icon.png",       # 图片（优先于 icon）
  accent = "#10b981",       # 主题色
  duration = 3000,          # 停留时长
  width = 360,              # 卡片宽度
  height = 200,             # 卡片高度
  entrance = "scale",       # scale | slideUp | flip
  delay = 0,
  time = null
}
```

---

## 7. `def` 宏

定义可复用的指令片段，类似函数。

### 7.1 定义

```
def 名称(参数1, 参数2 = 默认值) {
  ...指令，用 @参数名 引用参数...
}
```

### 7.2 调用

```
名称 { 参数1 = 值, 参数2 = 值 }
```

### 7.3 示例

```
def dot(color, r = 30) {
  circle {
    at = [0, 0],
    r = @r,
    fill = @color,
    stroke = "#ffffff",
    stroke-width = 2
  }
}

dot { at = [100, 100], color = "#4f46e5" }
dot { at = [300, 100], color = "#ef4444", r = 50 }
```

### 7.4 参数用于表达式

`@参数名` 可以参与算术和字符串拼接：

```
def bar(x, height, color) {
  rect {
    at = [@x, 500 - @height],   # 算数
    w = 50,
    h = @height,
    fill = @color,
    name = "bar_" + @x          # 字符串拼接
  }
}
```

### 7.5 宏里调用其他宏

```
def dot(color, r) {
  circle { at = [0, 0], r = @r, fill = @color }
}

def pair(color) {
  dot { at = [0, 0],   color = @color, r = 30 }
  dot { at = [100, 0], color = @color, r = 30 }
}
```

`def` 会在编译期展开，最终变成纯原子指令。

---

## 8. `import` 文件

把一个脚本文件的内容拼进当前位置。

### 8.1 语法

```
import "common/macros.txt"
import "scenes/intro.txt"
```

### 8.2 行为

- 路径相对于当前文件
- 内容**原样拼入**，相当于文本替换
- 循环 import 会报错
- 同一个文件被 import 多次只拼一次

### 8.3 典型用法

```
# main.txt
config {
  size = 960x640
}

import "common/macros.txt"    # 定义公共 def
import "scenes/intro.txt"      # 场景 1
import "scenes/demo.txt"       # 场景 2
import "scenes/outro.txt"      # 场景 3
```

---

## 9. 变量与表达式

### 9.1 参数引用

在 `def` 里用 `@参数名` 引用参数：

```
def dot(color, r) {
  circle { at = [0, 0], r = @r, fill = @color }
}
```

### 9.2 表达式

`@参数名` 可以参与：

| 操作 | 示例 |
|------|------|
| 算术 | `@x + 50`、`500 - @height` |
| 字符串拼接 | `"bar_" + @label` |
| 数组下标 | `@at[0]` |

**注意**：目前不支持复杂的逻辑表达式（`if`、比较等），条件由 JS API 侧控制。

---

## 10. 时间控制

### 10.1 默认顺序

指令从上到下依次执行：

```
circle { at = [100, 100], r = 40 }   # 0ms
circle { at = [200, 100], r = 40 }   # 上一条结束后
wait { ms = 500 }                    # 再等 500ms
dialog { at = [300, 200], text = "hi" }
```

### 10.2 `duration` 和 `delay`

```
move {
  target = "dot",
  to = [300, 200],
  duration = 800,   # 移动动画持续 800ms
  delay = 200       # 延迟 200ms 后开始
}
```

### 10.3 `time` 绝对时间

```
circle { at = [100, 100], r = 40, time = 0 }
circle { at = [200, 100], r = 40, time = 500 }   # 绝对 500ms
dialog { at = [300, 200], text = "hi", time = 1000 }
```

### 10.4 缓动函数

| 名称 | 效果 |
|------|------|
| `linear` | 匀速 |
| `easeIn` / `easeOut` / `easeInOut` | 基础缓动 |
| `easeInCubic` / `easeOutCubic` / `easeInOutCubic` | 三次 |
| `easeInBack` / `easeOutBack` / `easeInOutBack` | 回弹 |
| `easeInElastic` / `easeOutElastic` | 弹性 |
| `easeInBounce` / `easeOutBounce` | 弹跳 |

---

## 11. 完整示例

```
# ============================================
# 演示：三圆弹跳 + 对话 + 卡片
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

# 开场
tag { name = "start" }

text {
  at = [450, 80],
  content = "SVG 脚本播放器",
  size = 32,
  color = "#f1f5f9",
  anchor = "middle",
  weight = 700,
  name = "title"
}

fade { target = "title", to = 1, duration = 600 }

wait { ms = 300 }

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
  theme = "light",
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

---

## 12. 语法速查

### 语句格式

```
指令名  { 参数 }
```

### 参数格式

```
键 = 值,
键 = 值
```

### 值类型

```
40                    # 数字
"你好"                # 字符串
true                  # 布尔
[100, 200]            # 数组
"#4f46e5"             # 颜色
@r                    # 变量引用
```

### 位置

```
at = [100, 200]       绝对
at = [+50, -30]       相对
at = "_"              沿用
at = "@name"          引用
```

### 原子指令

```
circle  { at, r, fill, stroke, stroke-width, opacity, name }
rect    { at, w, h, rx, ry, fill, stroke, stroke-width, opacity, name }
line    { at, to, stroke, stroke-width, stroke-dasharray, opacity, name }
text    { at, content, size, color, anchor, weight, family, opacity, name }
image   { at, src, w, h, preserveAspectRatio, opacity, name }
path    { at, d, fill, stroke, stroke-width, opacity, name }

move    { target, to, duration, easing, delay, time }
scale   { target, factor, duration, easing, delay, time }
rotate  { target, angle, duration, easing, delay, time }
fade    { target, to, duration, easing, delay, time }

wait    { ms }
tag     { name }
```

### 控制指令

```
config  { size, background, loop, speed, defaultEasing }
group   { at, delay, children }
```

### 模板指令

```
dialog  { at, text, speaker, side, theme, typing, duration, width, avatar, delay, time }
card    { at, title, subtitle, icon, image, accent, duration, width, height, entrance, delay, time }
```

### 定义与复用

```
def 名(参数1, 参数2 = 默认值) {
  指令 { ... @参数1 ... }
}

名 { 参数1 = 值, 参数2 = 值 }

import "文件路径"
```

### 缓动函数

```
linear, easeIn, easeOut, easeInOut,
easeInCubic, easeOutCubic, easeInOutCubic,
easeInBack, easeOutBack, easeInOutBack,
easeInElastic, easeOutElastic,
easeInBounce, easeOutBounce
```

### 时间参数

```
duration = 500      动画时长
delay = 200         开始前延迟
time = 1000         绝对开始时间
```

---

## 附录：常见错误

| 错误 | 原因 | 修法 |
|------|------|------|
| `未知指令: xxx` | 指令名拼错，或 `def` 没定义 | 检查拼写，确认 def 已定义 |
| `def xxx 缺少参数: yyy` | def 调用时必填参数没传 | 补上参数或给 def 参数加默认值 |
| `花括号未闭合` | `{` 和 `}` 数量不匹配 | 检查配对 |
| `无法解析的语句` | 有非指令内容 | 检查是否有多余字符或缺少 `{}` |
| `坐标解析失败` | `at` 不是 `[x, y]` 格式 | 用 `[100, 200]` 而非 `100,200` |
| `属性 NaN` | 模板参数缺失 | 检查模板必填字段是否填了 |

---

## 文档版本

- 版本：0.1.0
- 更新：随包版本同步

有疑问或想扩展语法，参考 `docs/api.md`（JS API）和 `docs/templates.md`（模板字段表）。