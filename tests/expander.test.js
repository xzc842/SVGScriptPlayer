import { describe, it, expect } from "vitest";
import { parseScript } from "../src/core/parser.js";
import { expandDefs } from "../src/core/expander.js";
import { ParseError } from "../src/utils/errors.js";

function expand(source) {
  return expandDefs(parseScript(source));
}

describe("expander", () => {
  // ============================================================
  // 无 def 的情况
  // ============================================================
  describe("无 def", () => {
    it("没有 def 时原样返回", () => {
      const ast = expand(`
        circle { at = [100, 100], r = 40 }
        rect { at = [200, 200], w = 50, h = 50 }
      `);
      expect(ast.body).toHaveLength(2);
      expect(ast.body[0].name).toBe("circle");
      expect(ast.body[1].name).toBe("rect");
    });

    it("空脚本返回空 body", () => {
      const ast = expand(``);
      expect(ast.body).toEqual([]);
    });

    it("只有 def 时 body 为空", () => {
      const ast = expand(`
        def dot(color) {
          circle { at = [0, 0], fill = @color }
        }
      `);
      expect(ast.body).toEqual([]);
    });
  });

  // ============================================================
  // 基础 def 展开
  // ============================================================
  describe("基础展开", () => {
    it("单个 def 调用", () => {
      const ast = expand(`
        def dot(color) {
          circle { at = [0, 0], r = 30, fill = @color }
        }
        dot { at = [100, 100], color = "red" }
      `);
      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].name).toBe("circle");
      expect(ast.body[0].params.fill).toBe("red");
      expect(ast.body[0].params.r).toBe(30);
    });

    it("def 展开为多个指令", () => {
      const ast = expand(`
        def pair(color) {
          circle { at = [0, 0], r = 30, fill = @color }
          circle { at = [100, 0], r = 30, fill = @color }
        }
        pair { color = "blue" }
      `);
      expect(ast.body).toHaveLength(2);
      expect(ast.body[0].params.fill).toBe("blue");
      expect(ast.body[1].params.fill).toBe("blue");
    });

    it("多次调用同一个 def", () => {
      const ast = expand(`
        def dot(color) {
          circle { at = [0, 0], fill = @color }
        }
        dot { color = "red" }
        dot { color = "blue" }
        dot { color = "green" }
      `);
      expect(ast.body).toHaveLength(3);
      expect(ast.body[0].params.fill).toBe("red");
      expect(ast.body[1].params.fill).toBe("blue");
      expect(ast.body[2].params.fill).toBe("green");
    });
  });

  // ============================================================
  // 参数绑定
  // ============================================================
  describe("参数绑定", () => {
    it("按名称绑定参数", () => {
      const ast = expand(`
        def box(w, h, fill) {
          rect { at = [0, 0], w = @w, h = @h, fill = @fill }
        }
        box { w = 100, h = 50, fill = "red" }
      `);
      expect(ast.body[0].params.w).toBe(100);
      expect(ast.body[0].params.h).toBe(50);
      expect(ast.body[0].params.fill).toBe("red");
    });

    it("参数顺序不影响", () => {
      const ast = expand(`
        def box(w, h, fill) {
          rect { at = [0, 0], w = @w, h = @h, fill = @fill }
        }
        box { fill = "red", h = 50, w = 100 }
      `);
      expect(ast.body[0].params.w).toBe(100);
      expect(ast.body[0].params.h).toBe(50);
      expect(ast.body[0].params.fill).toBe("red");
    });

    it("默认值被使用", () => {
      const ast = expand(`
        def dot(color, r = 30) {
          circle { at = [0, 0], r = @r, fill = @color }
        }
        dot { color = "red" }
      `);
      expect(ast.body[0].params.r).toBe(30);
    });

    it("传值覆盖默认值", () => {
      const ast = expand(`
        def dot(color, r = 30) {
          circle { at = [0, 0], r = @r, fill = @color }
        }
        dot { color = "red", r = 50 }
      `);
      expect(ast.body[0].params.r).toBe(50);
    });

    it("字符串参数", () => {
      const ast = expand(`
        def label(text) {
          text { at = [0, 0], content = @text }
        }
        label { text = "你好，世界" }
      `);
      expect(ast.body[0].params.content).toBe("你好，世界");
    });

    it("数组参数", () => {
      const ast = expand(`
        def atDot(pos) {
          circle { at = @pos, r = 30 }
        }
        atDot { pos = [100, 200] }
      `);
      expect(ast.body[0].params.at).toEqual([100, 200]);
    });

    it("缺参数抛 ParseError", () => {
      expect(() => {
        expand(`
          def dot(color, r) {
            circle { at = [0, 0], r = @r, fill = @color }
          }
          dot { color = "red" }
        `);
      }).toThrow(ParseError);
    });

    it("缺参数错误信息包含参数名", () => {
      try {
        expand(`
          def dot(color, r) {
            circle { at = [0, 0], r = @r, fill = @color }
          }
          dot { color = "red" }
        `);
      } catch (err) {
        expect(err.message).toMatch(/r/);
      }
    });
  });

  // ============================================================
  // 参数表达式
  // ============================================================
  describe("参数表达式", () => {
    it("参数参与算术", () => {
      const ast = expand(`
        def bar(x, h) {
          rect { at = [@x, 500 - @h], w = 50, h = @h }
        }
        bar { x = 100, h = 80 }
      `);
      expect(ast.body[0].params.at).toEqual([100, 420]);
      expect(ast.body[0].params.h).toBe(80);
    });

    it("参数参与加法", () => {
      const ast = expand(`
        def dot(x) {
          circle { at = [@x + 50, 100], r = 30 }
        }
        dot { x = 100 }
      `);
      expect(ast.body[0].params.at).toEqual([150, 100]);
    });

    it("参数参与字符串拼接", () => {
      const ast = expand(`
        def named(label) {
          circle { at = [0, 0], r = 30, name = "dot_" + @label }
        }
        named { label = "A" }
      `);
      expect(ast.body[0].params.name).toBe("dot_A");
    });

    it("参数在字符串中间", () => {
      const ast = expand(`
        def greeting(name) {
          text { at = [0, 0], content = "你好，" + @name }
        }
        greeting { name = "张三" }
      `);
      expect(ast.body[0].params.content).toBe("你好，张三");
    });
  });

  // ============================================================
  // 嵌套 def
  // ============================================================
  describe("嵌套 def", () => {
    it("def 里调用 def", () => {
      const ast = expand(`
        def dot(color) {
          circle { at = [0, 0], r = 30, fill = @color }
        }
        def pair(color) {
          dot { at = [0, 0], color = @color }
          dot { at = [100, 0], color = @color }
        }
        pair { color = "blue" }
      `);
      expect(ast.body).toHaveLength(2);
      expect(ast.body[0].params.fill).toBe("blue");
      expect(ast.body[1].params.fill).toBe("blue");
    });

    it("三层嵌套 def", () => {
      const ast = expand(`
        def a() {
          circle { at = [0, 0], r = 10 }
        }
        def b() {
          a { }
          a { }
        }
        def c() {
          b { }
          b { }
        }
        c { }
      `);
      expect(ast.body).toHaveLength(4);
      expect(ast.body.every((n) => n.name === "circle")).toBe(true);
    });

    it("嵌套 def 的参数传递", () => {
      const ast = expand(`
        def dot(color, r) {
          circle { at = [0, 0], r = @r, fill = @color }
        }
        def pair(color, r) {
          dot { at = [0, 0], color = @color, r = @r }
          dot { at = [100, 0], color = @color, r = @r }
        }
        pair { color = "red", r = 40 }
      `);
      expect(ast.body[0].params.r).toBe(40);
      expect(ast.body[0].params.fill).toBe("red");
      expect(ast.body[1].params.r).toBe(40);
    });
  });

  // ============================================================
  // group 里的 def
  // ============================================================
  describe("group 里的 def", () => {
    it("group children 里的 def 被展开", () => {
      const ast = expand(`
        def dot(color) {
          circle { at = [0, 0], r = 30, fill = @color }
        }
        group {
          at = [250, 250],
          children = [
            dot { at = [0, 0], color = "red" },
            dot { at = [100, 0], color = "blue" }
          ]
        }
      `);
      expect(ast.body).toHaveLength(1);
      const group = ast.body[0];
      expect(group.name).toBe("group");
      expect(Array.isArray(group.params.children)).toBe(true);
      expect(group.params.children).toHaveLength(2);
      expect(group.params.children[0].name).toBe("circle");
      expect(group.params.children[0].params.fill).toBe("red");
      expect(group.params.children[1].params.fill).toBe("blue");
    });

    it("group children 里混合 def 和原子指令", () => {
      const ast = expand(`
        def dot(color) {
          circle { at = [0, 0], r = 30, fill = @color }
        }
        group {
          at = [250, 250],
          children = [
            dot { at = [0, 0], color = "red" },
            rect { at = [100, 0], w = 50, h = 50 }
          ]
        }
      `);
      const children = ast.body[0].params.children;
      expect(children).toHaveLength(2);
      expect(children[0].name).toBe("circle");
      expect(children[1].name).toBe("rect");
    });

    it("嵌套 group 里的 def", () => {
      const ast = expand(`
        def dot(color) {
          circle { at = [0, 0], r = 30, fill = @color }
        }
        group {
          at = [100, 100],
          children = [
            group {
              at = [50, 50],
              children = [
                dot { at = [0, 0], color = "red" }
              ]
            }
          ]
        }
      `);
      const outer = ast.body[0];
      const inner = outer.params.children[0];
      expect(inner.name).toBe("group");
      expect(inner.params.children[0].name).toBe("circle");
      expect(inner.params.children[0].params.fill).toBe("red");
    });
  });

  // ============================================================
  // 完整脚本
  // ============================================================
  describe("完整脚本", () => {
    it("展开真实脚本", () => {
      const ast = expand(`
        config {
          size = "900x600"
        }

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

        group {
          at = [250, 250],
          children = [
            dot { at = [0, 0], color = "#4f46e5", r = 40, name = "a" },
            dot { at = [200, 0], color = "#ef4444", r = 40, name = "b" }
          ]
        }

        move { target = "a", to = [250, 220], duration = 200 }

        tag { name = "end" }
      `);

      expect(ast.body[0].name).toBe("config");
      expect(ast.body[1].name).toBe("tag");

      const group = ast.body[2];
      expect(group.name).toBe("group");
      expect(group.params.children).toHaveLength(2);
      expect(group.params.children[0].name).toBe("circle");
      expect(group.params.children[0].params.fill).toBe("#4f46e5");
      expect(group.params.children[1].params.fill).toBe("#ef4444");

      expect(ast.body[3].name).toBe("move");

      expect(ast.body[4].name).toBe("tag");
      expect(ast.body[4].params.name).toBe("end");
    });
  });
});