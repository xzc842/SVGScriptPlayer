import { getEasing } from "../utils/easing.js";

export default {
  name: "card",
  fields: {
    at:       { type: "coord",  default: [400, 300] },
    title:    { type: "string", required: true, default: "" },
    subtitle: { type: "string", default: "" },
    icon:     { type: "string", default: "" },
    image:    { type: "string", default: "" },
    accent:   { type: "string", default: "#4f46e5" },
    duration: { type: "number", default: 3000 },
    width:    { type: "number", default: 360 },
    height:   { type: "number", default: 200 },
    entrance: { type: "enum",   values: ["scale", "slideUp", "flip"], default: "scale" },
    delay:    { type: "number", default: 0 },
    time:     { type: "number", default: null },
  },

  build(params, ctx) {
    // 兜底
    const at       = Array.isArray(params.at) ? params.at : [400, 300];
    const title    = typeof params.title === "string" ? params.title : "";
    const subtitle = params.subtitle ?? "";
    const icon     = params.icon ?? "";
    const image    = params.image ?? "";
    const accent   = params.accent ?? "#4f46e5";
    const duration = Number.isFinite(params.duration) ? params.duration : 3000;
    const width    = Number.isFinite(params.width) ? params.width : 360;
    const height   = Number.isFinite(params.height) ? params.height : 200;
    const entrance = params.entrance ?? "scale";

    const startTime = params.time ?? (ctx?.time ?? 0) + (params.delay ?? 0);

    const cardX = at[0] - width / 2;
    const cardY = at[1] - height / 2;

    const actions = [];
    const uid = `${ctx?.time ?? 0}_${Math.random().toString(36).slice(2, 6)}`;
    const cardId = `card_${uid}`;
    const accentBarId = `${cardId}_bar`;
    const iconId = `${cardId}_icon`;
    const imgId = `${cardId}_img`;
    const titleId = `${cardId}_title`;
    const subId = `${cardId}_sub`;

    let fromX = cardX;
    let fromY = cardY;
    const enterDur = 420;

    if (entrance === "slideUp") {
      fromY = cardY + 60;
    }

    // 卡片背景
    actions.push({
      type: "create",
      shape: "rect",
      id: cardId,
      at: [fromX, fromY],
      params: {
        w: width,
        h: height,
        rx: 16,
        ry: 16,
        fill: "#ffffff",
        stroke: "#e2e8f0",
        "stroke-width": 1,
        opacity: 0,
      },
      time: startTime,
    });

    actions.push({
      type: "move",
      target: cardId,
      params: { to: [cardX, cardY] },
      time: startTime,
      duration: enterDur,
      easing: getEasing("easeOutBack"),
    });
    actions.push({
      type: "fade",
      target: cardId,
      params: { to: 1 },
      time: startTime,
      duration: enterDur * 0.7,
      easing: getEasing("easeOut"),
    });

    if (entrance === "scale" || entrance === "flip") {
      const startScale = entrance === "flip" ? 0.6 : 0.8;
      actions.push({
        type: "scale",
        target: cardId,
        params: { factor: startScale },
        time: startTime,
        duration: 0,
        easing: getEasing("linear"),
      });
      actions.push({
        type: "scale",
        target: cardId,
        params: { factor: 1 },
        time: startTime,
        duration: enterDur,
        easing: getEasing("easeOutBack"),
      });
    }

    // 顶部色条
    actions.push({
      type: "create",
      shape: "rect",
      id: accentBarId,
      at: [cardX, cardY],
      params: {
        w: width,
        h: 6,
        rx: 3,
        ry: 3,
        fill: accent,
        opacity: 0,
      },
      time: startTime + 120,
    });
    actions.push({
      type: "fade",
      target: accentBarId,
      params: { to: 1 },
      time: startTime + 120,
      duration: 260,
      easing: getEasing("easeOut"),
    });

    // 内容
    const contentTop = cardY + 40;
    let cursor = contentTop;

    if (image) {
      const imgSize = 56;
      actions.push({
        type: "create",
        shape: "image",
        id: imgId,
        at: [at[0] - imgSize / 2, cursor],
        params: {
          src: image,
          w: imgSize,
          h: imgSize,
          opacity: 0,
        },
        time: startTime + 220,
      });
      actions.push({
        type: "fade",
        target: imgId,
        params: { to: 1 },
        time: startTime + 220,
        duration: 320,
        easing: getEasing("easeOut"),
      });
      cursor += imgSize + 10;
    } else if (icon) {
      actions.push({
        type: "create",
        shape: "text",
        id: iconId,
        at: [at[0], cursor + 34],
        params: {
          content: icon,
          size: 44,
          color: accent,
          anchor: "middle",
          opacity: 0,
        },
        time: startTime + 220,
      });
      actions.push({
        type: "fade",
        target: iconId,
        params: { to: 1 },
        time: startTime + 220,
        duration: 320,
        easing: getEasing("easeOut"),
      });
      cursor += 60;
    }

    const titleY = cursor + 30;
    actions.push({
      type: "create",
      shape: "text",
      id: titleId,
      at: [at[0], titleY + 8],
      params: {
        content: title,
        size: 22,
        color: "#0f172a",
        anchor: "middle",
        weight: 600,
        opacity: 0,
      },
      time: startTime + 360,
    });
    actions.push({
      type: "fade",
      target: titleId,
      params: { to: 1 },
      time: startTime + 360,
      duration: 320,
      easing: getEasing("easeOut"),
    });
    actions.push({
      type: "move",
      target: titleId,
      params: { to: [at[0], titleY] },
      time: startTime + 360,
      duration: 320,
      easing: getEasing("easeOut"),
    });

    if (subtitle) {
      actions.push({
        type: "create",
        shape: "text",
        id: subId,
        at: [at[0], titleY + 42],
        params: {
          content: subtitle,
          size: 15,
          color: "#64748b",
          anchor: "middle",
          opacity: 0,
        },
        time: startTime + 500,
      });
      actions.push({
        type: "fade",
        target: subId,
        params: { to: 1 },
        time: startTime + 500,
        duration: 320,
        easing: getEasing("easeOut"),
      });
      actions.push({
        type: "move",
        target: subId,
        params: { to: [at[0], titleY + 36] },
        time: startTime + 500,
        duration: 320,
        easing: getEasing("easeOut"),
      });
    }

    // 淡出
    const fadeOutStart = startTime + duration;
    const fadeIds = [cardId, accentBarId, titleId];
    if (icon) fadeIds.push(iconId);
    if (image) fadeIds.push(imgId);
    if (subtitle) fadeIds.push(subId);

    for (const id of fadeIds) {
      actions.push({
        type: "fade",
        target: id,
        params: { to: 0 },
        time: fadeOutStart,
        duration: 300,
        easing: getEasing("easeIn"),
      });
    }

    actions.push({
      type: "scale",
      target: cardId,
      params: { factor: 0.96 },
      time: fadeOutStart,
      duration: 300,
      easing: getEasing("easeIn"),
    });

    return {
      actions,
      endTime: fadeOutStart + 300,
    };
  },
};