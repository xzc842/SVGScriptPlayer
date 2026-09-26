import { RuntimeError } from "../utils/errors.js";

export class SlotManager {
  constructor({ container, eventBus }) {
    this.container = container;
    this.eventBus = eventBus;
    this.slots = new Map();
  }

  create(id, { at = [0, 0], w = 300, h = 200 } = {}) {
    if (this.slots.has(id)) return this.slots.get(id);

    const div = document.createElement("div");
    div.className = "svg-script-slot";
    div.dataset.slotId = id;
    div.style.cssText = `
      position: absolute;
      left: ${at[0]}px;
      top: ${at[1]}px;
      width: ${w}px;
      height: ${h}px;
      pointer-events: auto;
    `;

    // 事件委托
    div.addEventListener("click", (e) => this.handleEvent(id, "click", e));
    div.addEventListener("input", (e) => this.handleEvent(id, "input", e));
    div.addEventListener("change", (e) => this.handleEvent(id, "change", e));
    div.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleEvent(id, "submit", e);
    });

    this.container.appendChild(div);
    this.slots.set(id, { id, div, at, w, h });
    return this.slots.get(id);
  }

  handleEvent(slotId, type, evt) {
    const target = evt.target;
    const payload = {
      value: target.dataset.value ?? target.value ?? null,
      text: target.textContent ?? null,
      key: target.dataset.key ?? null,
    };
    this.eventBus.emit("slot", {
      type: `slot:${type}`,
      slotId,
      elementId: target.id || null,
      payload,
      timestamp: Date.now(),
    });
  }

  get(id) {
    return this.slots.get(id);
  }

  setHTML(id, html) {
    const slot = this.slots.get(id);
    if (!slot) throw new RuntimeError(`插槽不存在: ${id}`);
    slot.div.innerHTML = html;
  }

  remove(id) {
    const slot = this.slots.get(id);
    if (!slot) return;
    slot.div.remove();
    this.slots.delete(id);
  }

  clear() {
    for (const slot of this.slots.values()) slot.div.remove();
    this.slots.clear();
  }

  snapshot() {
    const out = [];
    for (const slot of this.slots.values()) {
      out.push({
        id: slot.id,
        at: slot.at,
        w: slot.w,
        h: slot.h,
        html: slot.div.innerHTML,
      });
    }
    return out;
  }
}