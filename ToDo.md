# ToDo清单

## 功能完整性

| 项 | 说明 |
|---|---|
| **补齐 `examples/node/`** | `render-gif.js`、`render-frames.js`、`batch-render.js` |
| **补模板** | `typewriter`、`progress`、`highlight`、`node`、`chart-bar`、`chart-line`、`transition` |
| **`div` 指令支持** | 脚本里的 `div` 创建插槽，Node 里跳过 |
| **`div` 的 Node 表现** | 渲染视频时如何处理插槽（跳过 or 渲染静态） |
| **`import` 的相对路径** | `loadFile` 要带出当前文件目录 |
| **`import` 的循环检测** | 已有，需测试 |
| **`import` 去重** | 同一文件多次 import 只拼一次 |

## 体验

| 项 | 说明 |
|---|---|
| **`setSpeed` 播放中平滑变速** | 已有，需测试 |
| **`seek` 时重绘优化** | 目前每帧重建整个 SVG，命令多时慢 |
| **`renderer` 增量更新** | 只更新变化的元素，不重建 |
| **`size` 支持百分比** | `size = "100%x100%"` |
| **`text` 自动换行** | 长文本自动分行 |
| **`text` 支持 `maxWidth`** | 超出宽度省略或换行 |
| **`image` 缓存** | 同一图片只 fetch 一次 |
| **`line` 的 `stroke` 默认值** | 已修，需测试 |
| **`serialize` 属性去重** | 已修，需测试 |
| **TypeScript 类型** | `dist/index.d.ts` |
| **ESLint + Prettier** | 代码规范 |

## 扩展（进阶）

| 项 | 说明 |
|---|---|
| **`div` 插槽的 Node 渲染** | 用 headless 浏览器渲染 HTML 到 PNG |
| **`if` / `each`** | 条件与循环（当前设计不支持，由 JS 控制） |
| **变量 `@let`** | 脚本内定义变量 |
| **表达式增强** | `@a + @b * 2`、函数调用 |
| **颜色渐变** | `linearGradient` 支持 |
| **滤镜** | `blur`、`shadow` |
| **`rotate` 绕指定原点** | 当前绕元素中心 |
| **`path` 描边动画** | `stroke-dasharray` + `stroke-dashoffset` |
| **`clipPath`** | 裁剪 |
| **`mask`** | 遮罩 |
| **音频** | 同步播放音频 |
| **视频嵌入** | 嵌入视频 |
| **`sequence` / `parallel`** | 显式控制顺序/并行 |
| **`at` 支持 `@screen`** | 画布中心 |
| **`at` 支持 `@tag`** | 引用 tag 位置 |

## 五、文档（已有大部分）

| 项 | 状态 |
|---|---|
| `docs/script.md` | ✅ |
| `docs/api.md` | ✅ |
| `docs/templates.md` | ✅ |
| `docs/ai-prompt.md` | ✅ |
| `README.md` | ✅ |
| **`docs/changelog.md`** | ❌ 待写 |
| **`docs/migration.md`** | ❌ 待写（版本升级指南） |
| **`docs/examples.md`** | ❌ 待写（更多场景示例） |

## 六、生态（长期）

| 项 | 说明 |
|---|---|
| **在线编辑器** | 写脚本实时预览 |
| **模板市场** | 用户分享模板 |
| **VS Code 插件** | 语法高亮、自动补全 |
| **CLI 工具** | `svg-player render intro.txt` |
