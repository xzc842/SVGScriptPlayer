const SVG_NS = "http://www.w3.org/2000/svg";

function numOr(v, fallback = 0) {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export class Renderer {
  constructor({ mode = "dom" } = {}) {
    this.mode = mode;
    this.elements = new Map();
    this.root = null;
    this.size = [800, 600];
    this.background = "#ffffff";
  }

  createRoot(size, background) {
    this.size = Array.isArray(size) ? size : [800, 600];
    this.background = background || "#ffffff";
    this.elements.clear();

    if (this.mode === "dom") {
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("xmlns", SVG_NS);
      svg.setAttribute(
        "viewBox",
        `0 0 ${this.size[0]} ${this.size[1]}`
      );
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.style.background = this.background;
      this.root = svg;
    } else {
      this.root = null;
    }
    return this.root;
  }

  apply(action) {
    switch (action.type) {
      case "create":
        this.createShape(action);
        break;
      case "move":
      case "scale":
      case "rotate":
      case "fade":
        this.applyTransform(action);
        break;
    }
  }

  createShape(action) {
    const { shape, id, params, at } = action;
    const x = numOr(at?.[0], 0);
    const y = numOr(at?.[1], 0);

    if (this.mode === "dom") {
      const el = this.createDomElement(shape, params, x, y);
      if (!el) return;
      el.setAttribute("data-id", id);

      if (params.opacity !== undefined) {
        el.setAttribute("opacity", numOr(params.opacity, 1));
      }
      if (params.transform) {
        el.setAttribute("transform", params.transform);
      }

      this.root.appendChild(el);
      this.elements.set(id, el);
    } else {
      this.elements.set(id, { shape, params, at: [x, y] });
    }
  }

  createDomElement(shape, params, x, y) {
    let el;

    if (shape === "circle") {
      el = document.createElementNS(SVG_NS, "circle");
      el.setAttribute("cx", x);
      el.setAttribute("cy", y);
      el.setAttribute("r", numOr(params.r, 10));
      setCommon(el, params);
    } else if (shape === "rect") {
      el = document.createElementNS(SVG_NS, "rect");
      el.setAttribute("x", x);
      el.setAttribute("y", y);
      el.setAttribute("width", numOr(params.w, 50));
      el.setAttribute("height", numOr(params.h, 50));
      if (params.rx !== undefined) el.setAttribute("rx", numOr(params.rx, 0));
      if (params.ry !== undefined) el.setAttribute("ry", numOr(params.ry, 0));
      setCommon(el, params);
    } else if (shape === "line") {
      el = document.createElementNS(SVG_NS, "line");
      const to = params.to || [x + 100, y];
      const tx = numOr(to[0], x + 100);
      const ty = numOr(to[1], y);
      el.setAttribute("x1", x);
      el.setAttribute("y1", y);
      el.setAttribute("x2", tx);
      el.setAttribute("y2", ty);
      setCommon(el, params);
    } else if (shape === "path") {
      el = document.createElementNS(SVG_NS, "path");
      el.setAttribute("d", params.d ?? "");
      el.setAttribute("transform", `translate(${x}, ${y})`);
      setCommon(el, params);
    } else if (shape === "image") {
      el = document.createElementNS(SVG_NS, "image");
      el.setAttribute("href", params.src ?? "");
      el.setAttribute("x", x);
      el.setAttribute("y", y);
      if (params.w !== undefined) el.setAttribute("width", numOr(params.w, 0));
      if (params.h !== undefined) el.setAttribute("height", numOr(params.h, 0));
      if (params.preserveAspectRatio) {
        el.setAttribute("preserveAspectRatio", params.preserveAspectRatio);
      }
    } else if (shape === "text") {
      el = document.createElementNS(SVG_NS, "text");
      el.setAttribute("x", x);
      el.setAttribute("y", y);
      el.setAttribute("font-size", numOr(params.size, 16));
      el.setAttribute("fill", params.color ?? "#000");
      el.setAttribute("text-anchor", params.anchor ?? "start");
      if (params.weight) el.setAttribute("font-weight", params.weight);
      if (params.family) el.setAttribute("font-family", params.family);
      el.textContent = params.content ?? "";
    } else {
      // 未知 shape，跳过
      return null;
    }

    return el;
  }

  applyTransform(action) {
    if (this.mode !== "dom") return;
    const el = this.elements.get(action.target);
    if (!el) return;

    const p = action.params;

    if (action.type === "move" && p.to) {
      this.moveElement(el, [numOr(p.to[0], 0), numOr(p.to[1], 0)]);
    } else if (action.type === "fade") {
      el.setAttribute("opacity", numOr(p.to, 1));
    } else if (action.type === "scale") {
      const f = numOr(p.factor, 1);
      const [cx, cy] = this.getElementCenter(el);
      el.setAttribute(
        "transform",
        `translate(${cx}, ${cy}) scale(${f}) translate(${-cx}, ${-cy})`
      );
    } else if (action.type === "rotate") {
      const [cx, cy] = this.getElementCenter(el);
      el.setAttribute(
        "transform",
        `rotate(${numOr(p.angle, 0)}, ${cx}, ${cy})`
      );
    }
  }

  moveElement(el, to) {
    const tag = el.tagName.toLowerCase();
    const [x, y] = to;
    if (tag === "circle") {
      el.setAttribute("cx", x);
      el.setAttribute("cy", y);
    } else if (tag === "line") {
      const x1 = numOr(el.getAttribute("x1"), 0);
      const y1 = numOr(el.getAttribute("y1"), 0);
      const x2 = numOr(el.getAttribute("x2"), 0);
      const y2 = numOr(el.getAttribute("y2"), 0);
      const dx = x - x1;
      const dy = y - y1;
      el.setAttribute("x1", x);
      el.setAttribute("y1", y);
      el.setAttribute("x2", x2 + dx);
      el.setAttribute("y2", y2 + dy);
    } else {
      el.setAttribute("x", x);
      el.setAttribute("y", y);
    }
  }

  getElementCenter(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === "circle") {
      return [
        numOr(el.getAttribute("cx"), 0),
        numOr(el.getAttribute("cy"), 0),
      ];
    }
    if (tag === "rect" || tag === "image") {
      const x = numOr(el.getAttribute("x"), 0);
      const y = numOr(el.getAttribute("y"), 0);
      const w = numOr(el.getAttribute("width"), 0);
      const h = numOr(el.getAttribute("height"), 0);
      return [x + w / 2, y + h / 2];
    }
    if (tag === "text") {
      const x = numOr(el.getAttribute("x"), 0);
      const y = numOr(el.getAttribute("y"), 0);
      return [x, y - 8];
    }
    return [
      numOr(el.getAttribute("x"), 0),
      numOr(el.getAttribute("y"), 0),
    ];
  }

  serialize() {
    if (this.mode === "dom") {
      return new XMLSerializer().serializeToString(this.root);
    }
    const parts = [];
    parts.push(
      `<svg xmlns="${SVG_NS}" viewBox="0 0 ${this.size[0]} ${this.size[1]}" width="${this.size[0]}" height="${this.size[1]}">`
    );
    parts.push(
      `<rect width="100%" height="100%" fill="${this.background}"/>`
    );
    for (const [id, e] of this.elements) {
      parts.push(serializeElement(id, e));
    }
    parts.push("</svg>");
    return parts.join("");
  }
}

function setCommon(el, params) {
  if (params.fill) el.setAttribute("fill", params.fill);
  else if (!el.hasAttribute("fill")) el.setAttribute("fill", "none");

  if (params.stroke) el.setAttribute("stroke", params.stroke);
  if (params["stroke-width"] !== undefined) {
    el.setAttribute("stroke-width", numOr(params["stroke-width"], 1));
  }
  if (params["stroke-dasharray"]) {
    el.setAttribute("stroke-dasharray", params["stroke-dasharray"]);
  }
  if (params["stroke-linecap"]) {
    el.setAttribute("stroke-linecap", params["stroke-linecap"]);
  }
}

function serializeElement(id, e) {
  const { shape, params, at } = e;
  const x = numOr(at?.[0], 0);
  const y = numOr(at?.[1], 0);

  if (shape === "circle") {
    return `<circle data-id="${id}" cx="${x}" cy="${y}" r="${numOr(params.r, 10)}" fill="${params.fill ?? "none"}" ${strokeAttrs(params)}${opacityAttr(params)}/>`;
  }

  if (shape === "rect") {
    const rx = params.rx !== undefined ? ` rx="${numOr(params.rx, 0)}"` : "";
    const ry = params.ry !== undefined ? ` ry="${numOr(params.ry, 0)}"` : "";
    return `<rect data-id="${id}" x="${x}" y="${y}" width="${numOr(params.w, 50)}" height="${numOr(params.h, 50)}"${rx}${ry} fill="${params.fill ?? "none"}" ${strokeAttrs(params)}${opacityAttr(params)}/>`;
  }

  if (shape === "line") {
    const to = params.to || [x + 100, y];
    const strokeParams = { stroke: "#000", ...params };
    return `<line data-id="${id}" x1="${x}" y1="${y}" x2="${numOr(to[0], x + 100)}" y2="${numOr(to[1], y)}" ${strokeAttrs(strokeParams)}${opacityAttr(params)}/>`;
  }

  if (shape === "path") {
    return `<path data-id="${id}" d="${params.d ?? ""}" transform="translate(${x}, ${y})" fill="${params.fill ?? "none"}" ${strokeAttrs(params)}${opacityAttr(params)}/>`;
  }

  if (shape === "image") {
    const w = params.w !== undefined ? ` width="${numOr(params.w, 0)}"` : "";
    const h = params.h !== undefined ? ` height="${numOr(params.h, 0)}"` : "";
    const par = params.preserveAspectRatio
      ? ` preserveAspectRatio="${params.preserveAspectRatio}"`
      : "";
    return `<image data-id="${id}" href="${params.src ?? ""}" x="${x}" y="${y}"${w}${h}${par}${opacityAttr(params)}/>`;
  }

  if (shape === "text") {
    const anchor = params.anchor ? ` text-anchor="${params.anchor}"` : "";
    const weight = params.weight ? ` font-weight="${params.weight}"` : "";
    const family = params.family ? ` font-family="${params.family}"` : "";
    return `<text data-id="${id}" x="${x}" y="${y}" font-size="${numOr(params.size, 16)}" fill="${params.color ?? "#000"}"${anchor}${weight}${family}${opacityAttr(params)}>${escapeXml(params.content ?? "")}</text>`;
  }

  return "";
}

function strokeAttrs(params) {
  const s = [];
  if (params.stroke) s.push(`stroke="${params.stroke}"`);
  if (params["stroke-width"] !== undefined) {
    s.push(`stroke-width="${numOr(params["stroke-width"], 1)}"`);
  }
  if (params["stroke-dasharray"]) {
    s.push(`stroke-dasharray="${params["stroke-dasharray"]}"`);
  }
  if (params["stroke-linecap"]) {
    s.push(`stroke-linecap="${params["stroke-linecap"]}"`);
  }
  return s.join(" ");
}

function opacityAttr(params) {
  return params.opacity !== undefined
    ? ` opacity="${numOr(params.opacity, 1)}"`
    : "";
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}