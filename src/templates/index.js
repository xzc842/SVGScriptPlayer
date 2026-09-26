import dialog from "./dialog.js";
import card from "./card.js";

const registry = new Map();

export function registerTemplate(name, tpl) {
  registry.set(name, tpl);
}

export function getTemplate(name) {
  return registry.get(name);
}

export function getAllTemplates() {
  const out = {};
  for (const [name, tpl] of registry) out[name] = tpl;
  return out;
}

let loaded = false;
export function loadBuiltinTemplates() {
  if (loaded) return;
  registerTemplate("dialog", dialog);
  registerTemplate("card", card);
  loaded = true;
}

export { dialog, card };