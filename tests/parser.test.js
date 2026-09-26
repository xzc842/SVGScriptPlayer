import { describe, it, expect } from "vitest";
import { parseScript } from "../src/core/parser.js";
import { ParseError } from "../src/utils/errors.js";

describe("parser", () => {
  // ============================================================
  // 基础
  // ============================================================
  describe("基础", () => {
    it("空字符串返回空 Program", () => {
      const ast = parseScript("");
      expect(ast.type).toBe("Program");
      expect(ast.body).toEqual([]);
    });

    it("只有注释返回空 Program", () => {
      const ast = parseScript(`
        # 这是注释
        # 另一行注释
      `);
      expect(ast.body).toEqual([]);
    });

    it("解析最简单的 circle", () => {
      const ast = parseScript(`circle { at = [100, 100], r = 40 }`);
      expect(ast.body).toHaveLength(1);

      const node = ast.body[0];
      expect(node.type).toBe("Directive");
      expect(node.name).toBe("circle");
      expect(node.params.at).toEqual([100, 100]);
      expect(node.params.r).toBe(40);
    });

    it("记录行号", () => {
      const ast = parseScript(`
        circle { at = [100, 100], r = 40 }
        rect { at = [200, 200], w = 50, h = 50 }
      `);
      expect(ast.body[0].line).toBe(2);
      expect(ast.body[1].line).toBe(3);
    });
  });

  // ============================================================
  // 值类型
  // ============================================================
  describe("值类型", () => {
    it("数字", () => {
      const ast = parseScript(`circle { r = 40 }`);
      expect(ast.body[0].params.r).toBe(40);
    });

    it("浮点数", () => {
      const ast = parseScript(`circle { r = 1.5 }`);
      expect(ast.body[0].params.r).toBe(1.5);
    });

    it("负数", () => {
      const ast = parseScript(`circle { r = -10 }`);
      expect(ast.body[0].params.r).toBe(-10);
    });

    it("双引号字符串", () => {
      const ast = parseScript(`text { content = "你好" }`);
      expect(ast.body[0].params.content).toBe("你好");
    });

    it("单引号字符串", () => {
      const ast = parseScript(`text { content = '你好' }`);
      expect(ast.body[0].params.content).toBe("你好");
    });

    it("布尔 true", () => {
      const ast = parseScript(`dialog { typing = true }`);
      expect(ast.body[0].params.typing).toBe(true);
    });

    it("布尔 false", () => {
      const ast = parseScript(`dialog { typing = false }`);
      expect(ast.body[0].params.typing).toBe(false);
    });

    it("null", () => {
      const ast = parseScript(`dialog { time = null }`);
      expect(ast.body[0].params.time).toBe(null);
    });

    it("数组", () => {
      const ast = parseScript(`circle { at = [100, 200] }`);
      expect(ast.body[0].params.at).toEqual([100, 200]);
    });

    it("数组带空格", () => {
      const ast = parseScript(`circle { at = [ 100 , 200 ] }`);
      expect(ast.body[0].params.at).toEqual([100, 200]);
    });

    it("颜色字符串", () => {
      const ast = parseScript(`circle { fill = "#4f46e5" }`);
      expect(ast.body[0].params.fill).toBe("#4f46e5");
    });

    it("标识符字符串", () => {
      const ast = parseScript(`circle { fill = "red" }`);
      expect(ast.body[0].params.fill).toBe("red");
    });

    it("相对坐标字符串", () => {
      const ast = parseScript(`circle { at = [+50, -30] }`);
      expect(ast.body[0].params.at).toEqual([50, -30]);
    });
  });

  // ============================================================
  // 参数解析
  // ============================================================
  describe("参数解析", () => {
    it("单行多参数", () => {
      const ast = parseScript(`circle { at = [100, 100], r = 40, fill = "red" }`);
      const p = ast.body[0].params;
      expect(p.at).toEqual([100, 100]);
      expect(p.r).toBe(40);
      expect(p.fill).toBe("red");
    });

    it("多行参数", () => {
      const ast = parseScript(`
        dialog {
          at = [100, 200],
          text = "你好",
          duration = 2000
        }
      `);
      const p = ast.body[0].params;
      expect(p.at).toEqual([100, 200]);
      expect(p.text).toBe("你好");
      expect(p.duration).toBe(2000);
    });

    it("末尾逗号可选", () => {
      const ast1 = parseScript(`circle { at = [100, 100], r = 40, }`);
      const ast2 = parseScript(`circle { at = [100, 100], r = 40 }`);
      expect(ast1.body[0].params).toEqual(ast2.body[0].params);
    });

    it("数组内的逗号不被切分", () => {
      const ast = parseScript(`circle { at = [100, 200], r = 40 }`);
      const p = ast.body[0].params;
      expect(p.at).toEqual([100, 200]);
      expect(p.r).toBe(40);
    });

    it("字符串里的逗号不被切分", () => {
      const ast = parseScript(`text { content = "hello, world", size = 16 }`);
      const p = ast.body[0].params;
      expect(p.content).toBe("hello, world");
      expect(p.size).toBe(16);
    });
  });

  // ============================================================
  // 注释
  // ============================================================
  describe("注释", () => {
    it("整行注释被忽略", () => {
      const ast = parseScript(`
        # 这是注释
        circle { at = [100, 100], r = 40 }
      `);
      expect(ast.body).toHaveLength(1);
    });

    it("行尾注释被忽略", () => {
      const ast = parseScript(`
        circle {
          at = [100, 100],   # 位置
          r = 40             # 半径
        }
      `);
      expect(ast.body[0].params.r).toBe(40);
    });

    it("字符串里的 # 不被当注释", () => {
      const ast = parseScript(`circle { fill = "#ff0000" }`);
      expect(ast.body[0].params.fill).toBe("#ff0000");
    });
  });

  // ============================================================
  // 控制指令
  // ============================================================
  describe("控制指令", () => {
    it("config", () => {
      const ast = parseScript(`
        config {
          size = "900x600",
          background = "#0f172a"
        }
      `);
      expect(ast.body[0].name).toBe("config");
      expect(ast.body[0].params.size).toBe("900x600");
      expect(ast.body[0].params.background).toBe("#0f172a");
    });

    it("tag", () => {
      const ast = parseScript(`tag { name = "start" }`);
      expect(ast.body[0].name).toBe("tag");
      expect(ast.body[0].params.name).toBe("start");
    });
  });

  // ============================================================
  // def 宏
  // ============================================================
  describe("def 宏", () => {
    it("解析最简单的 def", () => {
      const ast = parseScript(`
        def dot(color, r) {
          circle { at = [0, 0], r = @r, fill = @color }
        }
      `);
      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe("Def");
      expect(ast.body[0].name).toBe("dot");
      expect(ast.body[0].params).toHaveLength(2);
      expect(ast.body[0].params[0].name).toBe("color");
      expect(ast.body[0].params[1].name).toBe("r");
    });

    it("解析带默认值的 def 参数", () => {
      const ast = parseScript(`
        def dot(color, r = 30) {
          circle { at = [0, 0], r = @r, fill = @color }
        }
      `);
      expect(ast.body[0].params[1].name).toBe("r");
      expect(ast.body[0].params[1].default).toBe(30);
    });

    it("def 的 body 不包含外层花括号", () => {
      const ast = parseScript(`
        def dot(color, r) {
          circle { at = [0, 0], r = @r, fill = @color }
        }
      `);
      const body = ast.body[0].body;
      expect(typeof body).toBe("string");
      expect(body).not.toContain("def dot");
      expect(body).toContain("@r");
      expect(body).toContain("@color");
      expect(body).toContain("circle");
    });

    it("def 后跟其他指令", () => {
      const ast = parseScript(`
        def dot(color) {
          circle { at = [0, 0], fill = @color }
        }
        circle { at = [100, 100], r = 40 }
      `);
      expect(ast.body).toHaveLength(2);
      expect(ast.body[0].type).toBe("Def");
      expect(ast.body[1].name).toBe("circle");
    });
  });

  // ============================================================
  // group
  // ============================================================
  describe("group", () => {
    it("解析 group", () => {
      const ast = parseScript(`
        group {
          at = [250, 250],
          children = [
            circle { at = [0, 0], r = 30 },
            circle { at = [60, 0], r = 30 }
          ]
        }
      `);
      expect(ast.body[0].name).toBe("group");
      expect(ast.body[0].params.at).toEqual([250, 250]);
      // children 可能是字符串或数组（取决于 parser 实现）
      const children = ast.body[0].params.children;
      expect(
        typeof children === "string" || Array.isArray(children)
      ).toBe(true);
    });

    it("单行 group", () => {
      const ast = parseScript(`
        group { at = [100, 100], children = [circle { at = [0, 0], r = 10 }] }
      `);
      expect(ast.body[0].name).toBe("group");
    });
  });

  // ============================================================
  // import
  // ============================================================
  describe("import", () => {
    it("解析 import", () => {
      const ast = parseScript(`import "common/macros.txt"`);
      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe("Import");
      expect(ast.body[0].path).toBe("common/macros.txt");
    });

    it("import 用单引号", () => {
      const ast = parseScript(`import 'common/macros.txt'`);
      expect(ast.body[0].path).toBe("common/macros.txt");
    });

    it("import 后跟其他指令", () => {
      const ast = parseScript(`
        import "a.txt"
        circle { at = [100, 100], r = 40 }
      `);
      expect(ast.body).toHaveLength(2);
      expect(ast.body[0].type).toBe("Import");
      expect(ast.body[1].name).toBe("circle");
    });
  });

  // ============================================================
  // 错误处理
  // ============================================================
  describe("错误处理", () => {
    it("花括号未闭合抛 ParseError", () => {
      expect(() => {
        parseScript(`circle { at = [100, 100]`);
      }).toThrow(ParseError);
    });

    it("无法解析的语句抛 ParseError", () => {
      expect(() => {
        parseScript(`这不是一条指令`);
      }).toThrow(ParseError);
    });

    it("错误带行号", () => {
      try {
        parseScript(`
          circle { at = [100, 100], r = 40 }

          这不是一条指令
        `);
      } catch (err) {
        expect(err.line).toBe(4);
      }
    });

    it("def 语法错误", () => {
      expect(() => {
        parseScript(`def { }`);
      }).toThrow(ParseError);
    });
  });

  // ============================================================
  // 完整脚本
  // ============================================================
  describe("完整脚本", () => {
    it("解析一个真实脚本", () => {
      const source = `
        # 演示脚本
        config {
          size = "900x600",
          background = "#0f172a"
        }

        def dot(color, r) {
          circle { at = [0, 0], r = @r, fill = @color }
        }

        tag { name = "start" }

        group {
          at = [250, 250],
          children = [
            dot { at = [0, 0], color = "#4f46e5", r = 40 },
            dot { at = [200, 0], color = "#ef4444", r = 40 }
          ]
        }

        dialog {
          at = [120, 380],
          speaker = "系统",
          text = "三个圆都跳完了",
          side = "left",
          duration = 2200
        }

        tag { name = "end" }
      `;

      const ast = parseScript(source);
      expect(ast.body).toHaveLength(6);

      expect(ast.body[0].name).toBe("config");
      expect(ast.body[1].type).toBe("Def");
      expect(ast.body[2].name).toBe("tag");
      expect(ast.body[3].name).toBe("group");
      expect(ast.body[4].name).toBe("dialog");
      expect(ast.body[5].name).toBe("tag");
    });
  });
});