import { renderScriptToVideo } from "./render.js";

export async function renderBatch(jobs, defaults = {}) {
  const { concurrency = 2, ...sharedOpts } = defaults;
  const results = [];
  const queue = [...jobs];

  async function worker(id) {
    while (queue.length) {
      const job = queue.shift();
      if (!job) break;
      const { script, scriptFile, output, ...jobOpts } = job;

      try {
        const res = await renderScriptToVideo({
          ...sharedOpts,
          ...jobOpts,
          script,
          scriptFile,
          output,
        });
        results.push({ status: "ok", output, ...res });
      } catch (err) {
        results.push({ status: "error", output, error: err.message });
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, jobs.length) },
    (_, i) => worker(i)
  );
  await Promise.all(workers);

  return results;
}