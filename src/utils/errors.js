export class SVGScriptError extends Error {
  constructor(message, { file = null, line = null, column = null, type = "error" } = {}) {
    super(message);
    this.name = "SVGScriptError";
    this.file = file;
    this.line = line;
    this.column = column;
    this.type = type;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      file: this.file,
      line: this.line,
      column: this.column,
      type: this.type,
    };
  }
}

export class ParseError extends SVGScriptError {
  constructor(message, loc) {
    super(message, { ...loc, type: "parse" });
    this.name = "ParseError";
  }
}

export class CompileError extends SVGScriptError {
  constructor(message, loc) {
    super(message, { ...loc, type: "compile" });
    this.name = "CompileError";
  }
}

export class RuntimeError extends SVGScriptError {
  constructor(message, loc) {
    super(message, { ...loc, type: "runtime" });
    this.name = "RuntimeError";
  }
}

export class ImportError extends SVGScriptError {
  constructor(message, loc) {
    super(message, { ...loc, type: "import" });
    this.name = "ImportError";
  }
}