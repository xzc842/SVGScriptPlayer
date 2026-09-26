export class Timeline {
  constructor(actions, duration) {
    this.actions = actions;
    this.duration = duration;
    this.tags = new Map();
    for (const a of actions) {
      if (a.type === "tag") this.tags.set(a.name, a.time);
    }
  }

  getDuration() {
    return this.duration;
  }

  getTagTime(name) {
    return this.tags.get(name);
  }

  getTags() {
    return Array.from(this.tags.keys());
  }

  // 返回当前时间点之前的所有动作（按时间排序）
  getActionsUpTo(time) {
    return this.actions.filter((a) => a.time <= time && a.type !== "tag");
  }
}