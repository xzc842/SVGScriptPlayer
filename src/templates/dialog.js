import { getEasing } from "../utils/easing.js";

export default {
  name: "dialog",
  fields: {
    at:       { type: "coord",  default: [100, 200] },
    text:     { type: "string", required: true, default: "" },
    speaker:  { type: "string", default: "" },
    side:     { type: "enum",   values: ["left", "right"], default: "left" },
    theme:    { type: "enum",   values: ["light", "dark", "primary"], default: "light" },
    typing:   { type: "boolean", default: false },
    duration: { type: "number", default: 2500 },
    width:    { type: "number", default: 320 },
    avatar:   { type: "string", default: "" },
    delay:    { type: "number", default: 0 },
    time:     { type: "number", default: null },
  },

  build(params, ctx) {
    // 兜底：即使编译器没合并默认值，这里也不会 NaN
    const at      = Array.isArray(params.at) ? params.at : [100, 200];
    const text    = typeof params.text === "string" ? params.text : "";
    const speaker = params.speaker ?? "";
    const side    = params.side ?? "left";
    const theme   = params.theme ?? "light";
    const typing  = params.typing === true;
    const duration = Number.isFinite(params.duration) ? params.duration : 2500;
    const width   = Number.isFinite(params.width) ? params.width : 320;
    const avatar  = params.avatar ?? "";

    const startTime = params.time ?? (ctx?.time ?? 0) + (params.delay ?? 0);

    const themeMap = {
      light:   { bg: "#ffffff", border: "#e2e8f0", text: "#1e293b", name: "#64748b" },
      dark:    { bg: "#1e293b", border: "#334155", text: "#f1f5f9", name: "#94a3b8" },
      primary: { bg: "#4f46e5", border: "#4338ca", text: "#ffffff", name: "#c7d2fe" },
    };
    const c = themeMap[theme] || themeMap.light;

    const padding = 16;
    const avatarSize = avatar ? 48 : 0;
    const avatarGap = avatar ? 12 : 0;
    const nameHeight = speaker ? 22 : 0;
    const lineHeight = 22;
    const charsPerLine = Math.max(1, Math.floor((width - padding * 2) / 14));
    const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
    const textHeight = lines * lineHeight;
    const bubbleH = padding * 2 + nameHeight + textHeight + 8;
    const bubbleW = width;

    const isRight = side === "right";
    const avatarX = isRight
      ? at[0] + bubbleW + avatarGap
      : at[0] - avatarSize - avatarGap;
    const bubbleX = isRight ? at[0] : at[0] + avatarSize + avatarGap;
    const bubbleY = at[1];

    const actions = [];
    const uid = `${ctx?.time ?? 0}_${Math.random().toString(36).slice(2, 6)}`;
    const bubbleId = `dialog_bubble_${uid}`;
    const nameId   = `dialog_name_${uid}`;
    const textId   = `dialog_text_${uid}`;

    const enterDur = 320;
    const slideFrom = isRight ? 40 : -40;

    // 气泡背景
    actions.push({
      type: "create",
      shape: "rect",
      id: bubbleId,
      at: [bubbleX + slideFrom, bubbleY],
      params: {
        w: bubbleW,
        h: bubbleH,
        rx: 14,
        ry: 14,
        fill: c.bg,
        stroke: c.border,
        "stroke-width": 1.5,
        opacity: 0,
      },
      time: startTime,
    });
    actions.push({
      type: "move",
      target: bubbleId,
      params: { to: [bubbleX, bubbleY] },
      time: startTime,
      duration: enterDur,
      easing: getEasing("easeOut"),
    });
    actions.push({
      type: "fade",
      target: bubbleId,
      params: { to: 1 },
      time: startTime,
      duration: enterDur,
      easing: getEasing("easeOut"),
    });

    // 说话人名字
    if (speaker) {
      actions.push({
        type: "create",
        shape: "text",
        id: nameId,
        at: [bubbleX + padding, bubbleY + padding + 4],
        params: {
          content: speaker,
          size: 13,
          color: c.name,
          anchor: "start",
          opacity: 0,
        },
        time: startTime + 100,
      });
      actions.push({
        type: "fade",
        target: nameId,
        params: { to: 1 },
        time: startTime + 100,
        duration: 260,
        easing: getEasing("easeOut"),
      });
    }

    // 正文
    const textY = bubbleY + padding + nameHeight + 6 + 14;

    if (typing) {
      const perChar = 45;
      const charWidth = 15;
      for (let i = 0; i < text.length; i++) {
        const charId = `${textId}_c${i}`;
        actions.push({
          type: "create",
          shape: "text",
          id: charId,
          at: [bubbleX + padding + i * charWidth, textY],
          params: {
            content: text[i],
            size: 15,
            color: c.text,
            anchor: "start",
            opacity: 0,
          },
          time: startTime + 300,
        });
        actions.push({
          type: "fade",
          target: charId,
          params: { to: 1 },
          time: startTime + 300 + i * perChar,
          duration: 100,
          easing: getEasing("linear"),
        });
      }
    } else {
      actions.push({
        type: "create",
        shape: "text",
        id: textId,
        at: [bubbleX + padding, textY],
        params: {
          content: text,
          size: 15,
          color: c.text,
          anchor: "start",
          opacity: 0,
        },
        time: startTime + 200,
      });
      actions.push({
        type: "fade",
        target: textId,
        params: { to: 1 },
        time: startTime + 200,
        duration: 280,
        easing: getEasing("easeOut"),
      });
    }

    // 头像
    if (avatar) {
      const avatarId = `dialog_avatar_${uid}`;
      actions.push({
        type: "create",
        shape: "image",
        id: avatarId,
        at: [avatarX, bubbleY],
        params: {
          src: avatar,
          w: avatarSize,
          h: avatarSize,
          opacity: 0,
        },
        time: startTime + 80,
      });
      actions.push({
        type: "fade",
        target: avatarId,
        params: { to: 1 },
        time: startTime + 80,
        duration: 300,
        easing: getEasing("easeOut"),
      });
    }

    // 淡出
    const fadeOutStart = startTime + duration;
    const fadeIds = [bubbleId];
    if (speaker) fadeIds.push(nameId);
    if (!typing) fadeIds.push(textId);
    else {
      for (let i = 0; i < text.length; i++) {
        fadeIds.push(`${textId}_c${i}`);
      }
    }
    if (avatar) fadeIds.push(`dialog_avatar_${uid}`);

    for (const id of fadeIds) {
      actions.push({
        type: "fade",
        target: id,
        params: { to: 0 },
        time: fadeOutStart,
        duration: 280,
        easing: getEasing("easeIn"),
      });
    }

    return {
      actions,
      endTime: fadeOutStart + 280,
    };
  },
};