import { describe, it, expect, beforeEach, vi } from "vitest";
import { Player } from "../src/core/player.js";

const SCRIPT = `
config {
  size = "800x600"
}

circle { at = [100, 100], r = 40, name = "dot" }
move { target = "dot", to = [300, 300], duration = 500 }

tag { name = "middle" }

fade { target = "dot", to = 0, duration = 300 }
`;

function createPlayer(options = {}) {
  return new Player({
    mode: "node",
    container: null,
    ...options,
  });
}

describe("player", () => {
  // ============================================================
  // 加载
  // ============================================================
  describe("加载", () => {
    it("load 后 isLoaded 为 true", async () => {
      const player = createPlayer();
      expect(player.isLoaded()).toBe(false);

      await player.load(SCRIPT);
      expect(player.isLoaded()).toBe(true);
    });

    it("load 后 getDuration 返回总时长", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);
      expect(player.getDuration()).toBe(800);
    });

    it("load 后 getTags 返回所有 tag", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);
      expect(player.getTags()).toEqual(["middle"]);
    });

    it("load 后 getTagTime 返回 tag 时间", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);
      expect(player.getTagTime("middle")).toBe(500);
    });

    it("重新 load 会重置状态", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      player.seek(400);
      expect(player.getCurrentTime()).toBe(400);

      await player.load(SCRIPT);
      expect(player.getCurrentTime()).toBe(0);
    });
  });

  // ============================================================
  // 播放控制
  // ============================================================
  describe("播放控制", () => {
    beforeEach(() => {
      vi.stubGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 16));
      vi.stubGlobal("cancelAnimationFrame", (id) => clearTimeout(id));
      vi.stubGlobal("performance", { now: () => Date.now() });
    });

    it("play 后 isPlayingState 为 true", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      player.play();
      expect(player.isPlayingState()).toBe(true);

      player.pause();
    });

    it("pause 后 isPlayingState 为 false", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      player.play();
      player.pause();
      expect(player.isPlayingState()).toBe(false);
    });

    it("toggle 切换状态", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      player.toggle();
      expect(player.isPlayingState()).toBe(true);

      player.toggle();
      expect(player.isPlayingState()).toBe(false);
    });

    it("stop 停止并回到 0", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      player.seek(300);
      player.play();
      player.stop();

      expect(player.getCurrentTime()).toBe(0);
      expect(player.isPlayingState()).toBe(false);
    });

    it("reset 回到初始状态", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      player.seek(400);
      player.reset();

      expect(player.getCurrentTime()).toBe(0);
      expect(player.isPlayingState()).toBe(false);
    });
  });

  // ============================================================
  // seek
  // ============================================================
  describe("seek", () => {
    it("seek 设置当前时间", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      player.seek(300);
      expect(player.getCurrentTime()).toBe(300);
    });

    it("seek 超出范围被钳制", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      player.seek(-100);
      expect(player.getCurrentTime()).toBe(0);

      player.seek(99999);
      expect(player.getCurrentTime()).toBe(player.getDuration());
    });

    it("seekTag 跳到 tag 位置", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      player.seekTag("middle");
      expect(player.getCurrentTime()).toBe(500);
    });

    it("seekTag 不存在的 tag 不报错", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      expect(() => player.seekTag("nope")).not.toThrow();
    });

    it("seekPercent 跳到百分比", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      player.seekPercent(0.5);
      expect(player.getCurrentTime()).toBe(400);
    });

    it("getProgress 返回 0~1", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      expect(player.getProgress()).toBe(0);

      player.seek(400);
      expect(player.getProgress()).toBe(0.5);

      player.seek(800);
      expect(player.getProgress()).toBe(1);
    });
  });

  // ============================================================
  // 速度
  // ============================================================
  describe("速度", () => {
    it("setSpeed 设置速度", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      player.setSpeed(1.5);
      expect(player.getSpeed()).toBe(1.5);
    });

    it("默认速度 1.0", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      expect(player.getSpeed()).toBe(1.0);
    });
  });

  // ============================================================
  // 事件
  // ============================================================
  describe("事件", () => {
    beforeEach(() => {
      vi.stubGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 16));
      vi.stubGlobal("cancelAnimationFrame", (id) => clearTimeout(id));
      vi.stubGlobal("performance", { now: () => Date.now() });
    });

    it("load 事件被触发", async () => {
      const player = createPlayer();
      const handler = vi.fn();

      player.on("load", handler);
      await player.load(SCRIPT);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("play 事件被触发", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      const handler = vi.fn();
      player.on("play", handler);

      player.play();
      expect(handler).toHaveBeenCalledTimes(1);

      player.pause();
    });

    it("pause 事件被触发", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      const handler = vi.fn();
      player.on("pause", handler);

      player.play();
      player.pause();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("seek 事件被触发", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      const handler = vi.fn();
      player.on("seek", handler);

      player.seek(300);
      expect(handler).toHaveBeenCalledWith(300);
    });

    it("tag 事件在到达 tag 时触发", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      const handler = vi.fn();
      player.on("tag", handler);

      player.seek(500);
      expect(handler).toHaveBeenCalledWith("middle", 500);
    });

    it("tag 只触发一次", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      const handler = vi.fn();
      player.on("tag", handler);

      player.seek(500);
      player.seek(600);
      player.seek(700);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("off 移除监听", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      const handler = vi.fn();
      const off = player.on("seek", handler);

      player.seek(100);
      expect(handler).toHaveBeenCalledTimes(1);

      off();
      player.seek(200);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("once 只触发一次", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      const handler = vi.fn();
      player.once("seek", handler);

      player.seek(100);
      player.seek(200);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // 插槽
  // ============================================================
  describe("插槽", () => {
    it("无 container 时 getSlot 返回 null", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      expect(player.getSlot("nonexistent")).toBe(null);
    });
  });

  // ============================================================
  // 场景快照
  // ============================================================
  describe("场景快照", () => {
    it("getSceneSnapshot 返回当前状态", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      player.seek(300);
      const snapshot = player.getSceneSnapshot();

      expect(snapshot.currentTime).toBe(300);
      expect(snapshot.duration).toBe(800);
      expect(snapshot.tags).toEqual(["middle"]);
      expect(snapshot.isPlaying).toBe(false);
    });
  });

  // ============================================================
  // destroy
  // ============================================================
  describe("destroy", () => {
    it("destroy 后清理状态", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      player.destroy();

      expect(player.isLoaded()).toBe(false);
    });

    it("destroy 后事件监听被清除", async () => {
      const player = createPlayer();
      await player.load(SCRIPT);

      const handler = vi.fn();
      player.on("seek", handler);

      player.destroy();

      expect(() => player.seek(100)).not.toThrow();
    });
  });

  // ============================================================
  // 自定义模板
  // ============================================================
  describe("自定义模板", () => {
    it("加载自定义模板并展开", async () => {
      const customTpl = {
        name: "testBox",
        fields: {
          at: { type: "coord", default: [0, 0] },
          size: { type: "number", default: 100 },
        },
        build(params, ctx) {
          return {
            actions: [
              {
                type: "create",
                shape: "rect",
                id: "custom_box",
                at: params.at,
                params: { w: params.size, h: params.size, fill: "red" },
                time: ctx.time,
              },
            ],
            endTime: ctx.time + 1000,
          };
        },
      };

      const player = createPlayer({
        templates: { testBox: customTpl },
      });

      await player.load(`
        testBox { at = [100, 100], size = 50 }
      `);

      expect(player.isLoaded()).toBe(true);
      expect(player.getDuration()).toBe(1000);
    });
  });

  // ============================================================
  // 完整流程
  // ============================================================
  describe("完整流程", () => {
    beforeEach(() => {
      vi.stubGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 16));
      vi.stubGlobal("cancelAnimationFrame", (id) => clearTimeout(id));
      vi.stubGlobal("performance", { now: () => Date.now() });
    });

    it("加载 → 播放 → 暂停 → seek → 重置", async () => {
      const player = createPlayer();

      await player.load(SCRIPT);
      expect(player.isLoaded()).toBe(true);

      player.play();
      expect(player.isPlayingState()).toBe(true);

      player.pause();
      expect(player.isPlayingState()).toBe(false);

      player.seek(400);
      expect(player.getCurrentTime()).toBe(400);

      player.reset();
      expect(player.getCurrentTime()).toBe(0);
    });
  });
});