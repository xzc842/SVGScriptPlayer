import { ImportError } from "../utils/errors.js";

export async function expandImports(ast, { loadFile, basePath = "", seen = new Set() } = {}) {
  const result = { ...ast, body: [] };

  for (const node of ast.body) {
    if (node.type === "Import") {
      const resolved = resolvePath(basePath, node.path);
      if (seen.has(resolved)) {
        throw new ImportError(`循环 import: ${resolved}`, { file: ast.file, line: node.line });
      }
      seen.add(resolved);

      const source = await loadFile(resolved);
      const { parseScript } = await import("./parser.js");
      const childAst = parseScript(source, { file: resolved });
      const expanded = await expandImports(childAst, {
        loadFile,
        basePath: dirname(resolved),
        seen,
      });

      result.body.push(...expanded.body);
      seen.delete(resolved);
    } else {
      result.body.push(node);
    }
  }

  return result;
}

function resolvePath(base, path) {
  if (path.startsWith("/") || /^[a-z]+:\/\//i.test(path)) return path;
  if (!base) return path;
  return joinPath(base, path);
}

function joinPath(base, path) {
  const parts = base.split("/").filter(Boolean);
  for (const p of path.split("/")) {
    if (p === "." || p === "") continue;
    if (p === "..") parts.pop();
    else parts.push(p);
  }
  return parts.join("/");
}

function dirname(p) {
  const idx = p.lastIndexOf("/");
  return idx === -1 ? "" : p.slice(0, idx);
}