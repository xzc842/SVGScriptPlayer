import { describe, it, expect } from "vitest";
import { parseScript } from "../src/core/parser.js";
import { expandDefs } from "../src/core/expander.js";
import { compile } from "../src/core/compiler.js";
import { CompileError } from "../src/utils/errors.js";

/**
 * 一步到位：源脚本 → 编译结果
 */
function compileSource(source, options = {}) {
  const ast = parseScript(source);
  const expanded = expandDefs(ast);
  return compile(expanded, options);
}

describe("compiler", () => {
  // ============================================================
  // config
  // ============================================================
  describe("config", () => {
    it("默认配置", () => {
      const { config } = compileSource(``);
      expect(config.size).toEqual([800, 600]);
      expect(config.background).toBe("#ffffff");
      expect(config.defaultEasing).toBe("easeOut");
    });

    it("size 字符串转数组", () => {
      const { config } = compileSource(`
        config { size = "900x600" }
      `);
      expect(config.size).toEqual([900, 600]);
    });

    it("size 数组直接使用", () => {
      const { config } = compileSource(`
        config { size = [1280, 720] }
      `);
      expect(config.size).toEqual([1280, 720]);
    });

    it("覆盖默认配置", () => {
      const { config } = compileSource(`
        config {
          background = "#0f172a",
          defaultEasing = "linear"
        }
      `);
      expect(config.background).toBe("#0f172a");
      expect(config.defaultEasing).toBe("linear");
      expect(config.size).toEqual([800, 600]); // 未覆盖
    });
  });

  // ============================================================
  // 创建类指令
  // ============================================================
  describe("创建类", () => {
    it("circle 生成 create 动作", () => {
      const { actions } = compileSource(`
        circle { at = [100, 100], r = 40, fill = "red" }
      `);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({
        type: "create",
        shape: "circle",
        at: [100, 100],
      });
      expect(actions[0].params.r).toBe(40);
      expect(actions[0].params.fill).toBe("red");
    });

    it("rect 生成 create 动作", () => {
      const { actions } = compileSource(`
        rect { at = [10, 20], w = 100, h = 50 }
      `);
      expect(actions[0].shape).toBe("rect");
      expect(actions[0].at).toEqual([10, 20]);
    });

    it("text 生成 create 动作", () => {
      const { actions } = compileSource(`
        text { at = [50, 50], content = "你好", size = 16 }
      `);
      expect(actions[0].shape).toBe("text");
      expect(actions[0].params.content).toBe("你好");
    });

    it("image 生成 create 动作", () => {
      const { actions } = compileSource(`
        image { at = [0, 0], src = "a.png", w = 100, h = 100 }
      `);
      expect(actions[0].shape).toBe("image");
      expect(actions[0].params.src).toBe("a.png");
    });

    it("多个元素顺序排列", () => {
      const { actions } = compileSource(`
        circle { at = [100, 100], r = 40 }
        rect { at = [200, 200], w = 50, h = 50 }
        text { at = [300, 300], content = "hello" }
      `);
      expect(actions).toHaveLength(3);
      expect(actions[0].shape).toBe("circle");
      expect(actions[1].shape).toBe("rect");
      expect(actions[2].shape).toBe("text");
    });
  });

  // ============================================================
  // 变换类指令
  // ============================================================
  describe("变换类", () => {
    it("move 生成 move 动作", () => {
      const { actions } = compileSource(`
        circle { at = [100, 100], r = 40, name = "dot" }
        move { target = "dot", to = [300, 300], duration = 500 }
      `);
      expect(actions).toHaveLength(2);
      expect(actions[1]).toMatchObject({
        type: "move",
        target: "dot",
        duration: 500,
      });
      expect(actions[1].params.to).toEqual([300, 300]);
    });

    it("fade 生成 fade 动作", () => {
      const { actions } = compileSource(`
        circle { at = [100, 100], r = 40, name = "dot" }
        fade { target = "dot", to = 0, duration = 300 }
      `);
      expect(actions[1].type).toBe("fade");
      expect(actions[1].params.to).toBe(0);
    });

    it("scale 生成 scale 动作", () => {
      const { actions } = compileSource(`
        circle { at = [100, 100], r = 40, name = "dot" }
        scale { target = "dot", factor = 1.5, duration = 300 }
      `);
      expect(actions[1].type).toBe("scale");
      expect(actions[1].params.factor).toBe(1.5);
    });

    it("rotate 生成 rotate 动作", () => {
      const { actions } = compileSource(`
        rect { at = [100, 100], w = 50, h = 50, name = "box" }
        rotate { target = "box", angle = 45, duration = 400 }
      `);
      expect(actions[1].type).toBe("rotate");
      expect(actions[1].params.angle).toBe(45);
    });
  });

  // ============================================================
  // 控制类指令
  // ============================================================
  describe("控制类", () => {
    it("wait 推进时间", () => {
      const { actions, duration } = compileSource(`
        wait { ms = 500 }
        wait { ms = 300 }
      `);
      expect(actions).toHaveLength(0);
      expect(duration).toBe(800);
    });

    it("tag 生成 tag 动作", () => {
      const { actions } = compileSource(`tag { name = "start" }`);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({
        type: "tag",
        name: "start",
      });
    });
  });
  // ============================================================
  // div 插槽
  // ============================================================
  describe("div 插槽", () => {
    it("div 生成 slot 动作", () => {
      const { actions } = compileSource(`
        div { at = [200, 300], w = 400, h = 200, id = "quiz1" }
      `);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({
        type: "slot",
        id: "quiz1",
        at: [200, 300],
        w: 400,
        h: 200,
      });
    });

    it("div 缺 id 抛 CompileError", () => {
      expect(() => {
        compileSource(`div { at = [0, 0], w = 100, h = 100 }`);
      }).toThrow(CompileError);
    });

    it("div 使用默认 w 和 h", () => {
      const { actions } = compileSource(`
        div { at = [100, 100], id = "slot1" }
      `);
      expect(actions[0].w).toBe(300);
      expect(actions[0].h).toBe(200);
    });

    it("div 和其他指令混用", () => {
      const { actions } = compileSource(`
        text { at = [300, 200], content = "问题", size = 16 }
        div { at = [200, 320], w = 400, h = 120, id = "quiz1" }
        circle { at = [100, 100], r = 40 }
      `);
      const slots = actions.filter((a) => a.type === "slot");
      expect(slots).toHaveLength(1);
      expect(slots[0].id).toBe("quiz1");

      const circles = actions.filter(
        (a) => a.type === "create" && a.shape === "circle"
      );
      expect(circles).toHaveLength(1);

      const texts = actions.filter(
        (a) => a.type === "create" && a.shape === "text"
      );
      expect(texts).toHaveLength(1);
    });
  });
  // ============================================================
  // 时间轴
  // ============================================================
  describe("时间轴", () => {
    it("顺序执行累加时间", () => {
      const { actions } = compileSource(`
        move { target = "a", to = [100, 100], duration = 500 }
        move { target = "b", to = [200, 200], duration = 300 }
      `);
      expect(actions[0].time).toBe(0);
      expect(actions[1].time).toBe(500);
    });

    it("delay 累加", () => {
      const { actions } = compileSource(`
        move { target = "a", to = [100, 100], duration = 500 }
        move { target = "b", to = [200, 200], duration = 300, delay = 200 }
      `);
      expect(actions[1].time).toBe(700);
    });

    it("time 绝对时间", () => {
      const { actions } = compileSource(`
        move { target = "a", to = [100, 100], duration = 500, time = 1000 }
      `);
      expect(actions[0].time).toBe(1000);
    });
  });

  // ============================================================
  // def 宏展开
  // ============================================================
  describe("def 宏展开", () => {
    it("简单 def 展开", () => {
      const { actions } = compileSource(`
        def dot(color) {
          circle { at = [0, 0], r = 40, fill = @color }
        }
        dot { at = [100, 100], color = "red" }
      `);
      expect(actions).toHaveLength(1);
      expect(actions[0].shape).toBe("circle");
      expect(actions[0].params.fill).toBe("red");
    });

    it("def 带默认参数", () => {
      const { actions } = compileSource(`
        def dot(color, r = 30) {
          circle { at = [0, 0], r = @r, fill = @color }
        }
        dot { at = [100, 100], color = "red" }
      `);
      expect(actions[0].params.r).toBe(30);
    });

    it("def 参数参与算术", () => {
      const { actions } = compileSource(`
        def bar(x, h) {
          rect { at = [@x, 500 - @h], w = 50, h = @h }
        }
        bar { x = 100, h = 80 }
      `);
      expect(actions[0].at).toEqual([100, 420]);
      expect(actions[0].params.h).toBe(80);
    });

    it("def 嵌套调用", () => {
      const { actions } = compileSource(`
        def dot(color) {
          circle { at = [0, 0], r = 30, fill = @color }
        }
        def pair(color) {
          dot { at = [0, 0], color = @color }
          dot { at = [100, 0], color = @color }
        }
        pair { at = [200, 200], color = "blue" }
      `);
      expect(actions).toHaveLength(2);
      expect(actions[0].params.fill).toBe("blue");
      expect(actions[1].params.fill).toBe("blue");
    });

    it("def 缺参数抛 ParseError", () => {
      expect(() => {
        compileSource(`
          def dot(color, r) {
            circle { at = [0, 0], r = @r, fill = @color }
          }
          dot { at = [100, 100], color = "red" }
        `);
      }).toThrow(/缺少参数/);
    });
  });

  // ============================================================
  // group
  // ============================================================
  describe("group", () => {
    it("group 内子指令并行开始", () => {
      const { actions } = compileSource(`
        group {
          at = [250, 250],
          children = [
            circle { at = [0, 0], r = 30 },
            circle { at = [60, 0], r = 30 }
          ]
        }
      `);
      expect(actions).toHaveLength(2);
      expect(actions[0].time).toBe(0);
      expect(actions[1].time).toBe(0);
    });

    it("group 内子指令的 at 相对 group 的 at", () => {
      const { actions } = compileSource(`
        group {
          at = [250, 250],
          children = [
            circle { at = [0, 0], r = 30 },
            circle { at = [60, 0], r = 30 }
          ]
        }
      `);
      expect(actions[0].at).toEqual([250, 250]);
      expect(actions[1].at).toEqual([310, 250]);
    });

    it("group 结束后时间推进到最大结束时间", () => {
      const { duration } = compileSource(`
        group {
          at = [0, 0],
          children = [
            circle { at = [0, 0], r = 30, name = "a" },
            circle { at = [100, 0], r = 30, name = "b" }
          ]
        }
        move { target = "a", to = [0, 0], duration = 500 }
      `);
      expect(duration).toBe(500);
    });

    it("group 内可以使用 def", () => {
      const { actions } = compileSource(`
        def dot(color) {
          circle { at = [0, 0], r = 30, fill = @color }
        }
        group {
          at = [250, 250],
          children = [
            dot { at = [0, 0], color = "red" },
            dot { at = [60, 0], color = "blue" }
          ]
        }
      `);
      expect(actions).toHaveLength(2);
      expect(actions[0].params.fill).toBe("red");
      expect(actions[1].params.fill).toBe("blue");
    });

    it("嵌套 group", () => {
      const { actions } = compileSource(`
        group {
          at = [100, 100],
          children = [
            group {
              at = [50, 50],
              children = [
                circle { at = [0, 0], r = 30 }
              ]
            }
          ]
        }
      `);
      expect(actions).toHaveLength(1);
      expect(actions[0].at).toEqual([150, 150]);
    });
  });

  // ============================================================
  // 错误
  // ============================================================
  describe("错误", () => {
    it("未知指令抛 CompileError", () => {
      expect(() => {
        compileSource(`foobar { at = [100, 100] }`);
      }).toThrow(CompileError);
    });

    it("CompileError 带行号", () => {
      try {
        compileSource(`
          circle { at = [100, 100], r = 40 }
          foobar { at = [200, 200] }
        `);
      } catch (err) {
        expect(err.line).toBe(3);
      }
    });
  });

  // ============================================================
  // 完整脚本
  // ============================================================
  describe("完整脚本", () => {
    it("编译真实脚本", () => {
      const source = `
        config {
          size = "900x600",
          background = "#0f172a"
        }

        def dot(at, color, r) {
          circle {
            at = @at,
            r = @r,
            fill = @color,
            stroke = "#ffffff",
            stroke-width = 2
          }
        }

        tag { name = "start" }

        group {
          at = [250, 250],
          children = [
            dot { at = [0, 0], color = "#4f46e5", r = 40, name = "a" },
            dot { at = [200, 0], color = "#ef4444", r = 40, name = "b" }
          ]
        }

        move { target = "a", to = [250, 220], duration = 200 }
        move { target = "a", to = [250, 250], duration = 200 }

        tag { name = "end" }
      `;

      const { actions, duration, config } = compileSource(source);

      // config
      expect(config.size).toEqual([900, 600]);
      expect(config.background).toBe("#0f172a");

      // tag
      const tags = actions.filter((a) => a.type === "tag");
      expect(tags).toHaveLength(2);
      expect(tags[0].name).toBe("start");
      expect(tags[1].name).toBe("end");

      // group 里的两个圆
      const circles = actions.filter(
        (a) => a.type === "create" && a.shape === "circle"
      );
      expect(circles).toHaveLength(2);
      expect(circles[0].at).toEqual([250, 250]);
      expect(circles[1].at).toEqual([450, 250]);

      // 两次 move
      const moves = actions.filter((a) => a.type === "move");
      expect(moves).toHaveLength(2);

      // duration 累计
      expect(duration).toBeGreaterThan(0);
    });
  });
});