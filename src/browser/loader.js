export function createBrowserLoader(basePath = "") {
  const cache = new Map();

  return async function loadFile(path) {
    const url = joinPath(basePath, path);
    if (cache.has(url)) return cache.get(url);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`加载失败: ${url} (${res.status})`);
    }
    const text = await res.text();
    cache.set(url, text);
    return text;
  };
}

function joinPath(base, path) {
  if (!base) return path;
  if (path.startsWith("/") || /^[a-z]+:\/\//i.test(path)) return path;
  const b = base.endsWith("/") ? base : base + "/";
  return b + path;
}