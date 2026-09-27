import { parseScript } from "./parser.js";
import { expandImports } from "./importer.js";
import { expandDefs } from "./expander.js";
import { compile } from "./compiler.js";
import { Timeline } from "./timeline.js";
import { Renderer } from "./renderer.js";
import { EventBus } from "./events.js";
import { SlotManager } from "./slots.js";

export class Player {
  constructor(options = {}) {
    this.options = options;
    this.eventBus = new EventBus();
    this.renderer = new Renderer({ mode: options.mode || "dom" });
    this.timeline = null;
    this.config = null;
    this.templates = options.templates || {};
    this.slots = null;

    this.currentTime = 0;
    this.isPlaying = false;
    this.speed = options.speed ?? 1.0;
    this.startTimestamp = 0;
    this.pausedAt = 0;
    this.rafId = null;

    this._firedTags = new Set();

    this.container = options.container || null;
  }

  async load(source) {
    const ast = parseScript(source, { file: "inline" });

    // import 展开
    let expandedAst = ast;
    if (this.options.loadFile) {
      expandedAst = await expandImports(ast, {
        loadFile: this.options.loadFile,
        basePath: this.options.basePath || "",
      });
    }

    // def 展开
    const defExpanded = expandDefs(expandedAst);

    // 编译
    const { actions, duration, config } = compile(defExpanded, {
      templates: this.templates,
      config: this.options.config || {},
    });

    this.config = config;
    this.timeline = new Timeline(actions, duration);

    // 重置状态
    this.currentTime = 0;
    this.pausedAt = 0;
    this._firedTags.clear();

    // 初始化渲染根
    this.renderer.createRoot(config.size, config.background);

    // 挂载到容器（浏览器模式）
    if (this.container && this.renderer.root) {
      this.container.innerHTML = "";
      this.container.style.position = "relative";
      this.container.appendChild(this.renderer.root);

      // 插槽层
      const slotLayer = document.createElement("div");
      slotLayer.className = "svg-script-slot-layer";
      slotLayer.style.cssText =
        "position:absolute; inset:0; pointer-events:none;";
      this.container.appendChild(slotLayer);

      this.slots = new SlotManager({
        container: slotLayer,
        eventBus: this.eventBus,
      });
    }

    // 渲染第一帧
    this.render(0);

    this.eventBus.emit("load", { duration, config });
  }

  /**
   * 从文件加载脚本。
   * 需要 this.options.loadFile 已配置（浏览器用 fetch，Node 用 fs）。
   */
  async loadFile(path) {
    if (!this.options.loadFile) {
      throw new Error("未配置 loadFile，无法从文件加载");
    }
    const source = await this.options.loadFile(path);
    return await this.load(source);
  }

  play() {
    if (this.isPlaying || !this.timeline) return;
    const duration = this.timeline.getDuration();

    if (this.currentTime >= duration) {
      this.currentTime = 0;
      this.pausedAt = 0;
      this._firedTags.clear();
      this.render(0);
    }

    this.isPlaying = true;
    this.startTimestamp = performance.now();
    this.eventBus.emit("play");
    this.tick();
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.pausedAt = this.currentTime;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.eventBus.emit("pause");
  }

  toggle() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  stop() {
    this.pause();
    this.seek(0);
    this.eventBus.emit("stop");
  }

  reset() {
    this.pause();
    this.currentTime = 0;
    this.pausedAt = 0;
    this._firedTags.clear();
    if (this.slots) this.slots.clear();
    this.render(0);
    this.eventBus.emit("reset");
  }

  seek(time) {
    if (!this.timeline) return;
    const duration = this.timeline.getDuration();
    this.currentTime = Math.max(0, Math.min(time, duration));
    this.pausedAt = this.currentTime;
    this.render(this.currentTime);
    this.eventBus.emit("seek", this.currentTime);
  }

  seekTag(name) {
    if (!this.timeline) return;
    const t = this.timeline.getTagTime(name);
    if (t === undefined) return;
    this.seek(t);
  }

  seekPercent(p) {
    if (!this.timeline) return;
    const duration = this.timeline.getDuration();
    this.seek(duration * Math.max(0, Math.min(1, p)));
  }

  setSpeed(s) {
    if (this.isPlaying) {
      const now = performance.now();
      this.pausedAt =
        (now - this.startTimestamp) * this.speed + this.pausedAt;
      this.startTimestamp = now;
    }
    this.speed = s;
  }

  getSpeed() {
    return this.speed;
  }

  tick() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const elapsed = (now - this.startTimestamp) * this.speed + this.pausedAt;
    const duration = this.timeline.getDuration();

    if (elapsed >= duration) {
      this.currentTime = duration;
      this.render(duration);
      this.isPlaying = false;
      this.pausedAt = duration;
      this.rafId = null;
      this.eventBus.emit("timeupdate", duration, 1);
      this.eventBus.emit("complete");
      return;
    }

    this.currentTime = elapsed;
    this.render(elapsed);
    this.eventBus.emit("timeupdate", elapsed, elapsed / duration);

    this.rafId = requestAnimationFrame(() => this.tick());
  }

  render(time) {
    if (!this.timeline) return;

    // tag 触发检查
    for (const [name, t] of this.timeline.tags) {
      if (!this._firedTags.has(name) && time >= t) {
        this._firedTags.add(name);
        this.eventBus.emit("tag", name, t);
      }
    }

    // 重建 SVG
    const actions = this.timeline.getActionsUpTo(time);
    this.renderer.createRoot(this.config.size, this.config.background);

    if (this.container && this.renderer.root) {
      const old = this.container.querySelector("svg");
      if (old) {
        this.container.replaceChild(this.renderer.root, old);
      } else {
        this.container.insertBefore(
          this.renderer.root,
          this.container.firstChild
        );
      }
    }

    // 应用动作
    for (const a of actions) {
      if (a.type === "slot") {
        // 插槽：只创建一次
        if (this.slots && !this.slots.get(a.id)) {
          this.slots.create(a.id, {
            at: a.at || [0, 0],
            w: a.w,
            h: a.h,
          });
        }
        continue;
      }
      this.renderer.apply(a);
    }
  }

  // ===== 事件 =====
  on(event, handler) {
    return this.eventBus.on(event, handler);
  }
  off(event, handler) {
    return this.eventBus.off(event, handler);
  }
  once(event, handler) {
    return this.eventBus.once(event, handler);
  }

  // ===== 状态查询 =====
  getDuration() {
    return this.timeline?.getDuration() ?? 0;
  }
  getCurrentTime() {
    return this.currentTime;
  }
  getProgress() {
    const d = this.getDuration();
    return d ? this.currentTime / d : 0;
  }
  isPlayingState() {
    return this.isPlaying;
  }
  isLoaded() {
    return this.timeline !== null;
  }
  getTags() {
    return this.timeline?.getTags() ?? [];
  }
  getTagTime(name) {
    return this.timeline?.getTagTime(name);
  }

  // ===== 插槽 =====
  getSlot(id) {
    const slot = this.slots?.get(id);
    if (!slot) return null;
    return {
      id: slot.id,
      setHTML: (html) => this.slots.setHTML(id, html),
      emit: (type, payload) =>
        this.eventBus.emit("slot", {
          type: `slot:${type}`,
          slotId: id,
          payload,
          timestamp: Date.now(),
        }),
    };
  }

  setSlotHTML(id, html) {
    this.slots?.setHTML(id, html);
  }

  // ===== 场景快照 =====
  getSceneSnapshot() {
    return {
      currentTime: this.currentTime,
      isPlaying: this.isPlaying,
      duration: this.getDuration(),
      tags: this.getTags(),
      slots: this.slots?.snapshot() ?? [],
    };
  }

  destroy() {
    this.pause();
    this.eventBus.removeAll();
    if (this.slots) this.slots.clear();
    if (this.container) this.container.innerHTML = "";
    this.timeline = null;
    this.renderer = null;
  }
}