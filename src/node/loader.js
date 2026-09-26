import fs from "node:fs/promises";
import path from "node:path";

export function createNodeLoader(basePath = process.cwd()) {
  const cache = new Map();

  return async function loadFile(filePath) {
    const abs = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(basePath, filePath);

    if (cache.has(abs)) return cache.get(abs);

    const content = await fs.readFile(abs, "utf-8");
    cache.set(abs, content);
    return content;
  };
}

export async function readScript(filePath) {
  return await fs.readFile(filePath, "utf-8");
}