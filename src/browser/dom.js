export function queryContainer(selector) {
  if (typeof selector === "string") {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`容器不存在: ${selector}`);
    return el;
  }
  if (selector instanceof HTMLElement) return selector;
  throw new Error("container 必须是选择器字符串或 HTMLElement");
}