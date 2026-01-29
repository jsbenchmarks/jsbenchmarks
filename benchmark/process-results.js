import * as fs from "fs";
import * as path from "path";
import { benchmarks as allBenchmarks } from "./tests.js";

function analyzeTrace(trace) {
  const events = trace.traceEvents;
  const clickEvent = events.find(e =>
    e.name === 'EventDispatch' &&
    e.args?.data?.type === 'click'
  );
  const markEvent = events.find(e =>
    e.cat.includes('blink.user_timing') &&
    e.name === 'bench-dom-done'
  );

  // Not all benchmarks emit a mark (e.g. duration-based benchmarks like stream).
  // Return 0 to mean "not applicable".
  if (!clickEvent || !markEvent) return 0;

  const targetEvent = events.find(e =>
    e.name === 'Commit' &&
    e.ts >= markEvent.ts
  );

  if (!targetEvent) return 0;

  // Use the end of the event duration
  return (targetEvent.ts + (targetEvent.dur || 0) - clickEvent.ts) / 1000;
}

(async () => {
  const frameworksDir = "results/frameworks";
  const tracesDir = "results/public/traces";
  const outputPath = "results/src/data.ts";

  if (!fs.existsSync(frameworksDir)) {
    console.error(`Error: ${frameworksDir} not found. Run 'npm run bench' first.`);
    process.exit(1);
  }

  console.log("Processing results...");

  // 1. Load Frameworks
  const frameworkFiles = await fs.promises.readdir(frameworksDir);
  const frameworksMap = new Map();
  for (const file of frameworkFiles) {
    if (!file.endsWith(".json")) continue;
    const content = JSON.parse(await fs.promises.readFile(path.join(frameworksDir, file), "utf8"));
    // Ensure benchmarks array exists
    content.benchmarks = [];
    frameworksMap.set(content.framework, content);
  }

  // 2. Load Measurements
  if (fs.existsSync(tracesDir)) {
    const traceFiles = await fs.promises.readdir(tracesDir);
    const metaFiles = traceFiles.filter(f => f.endsWith(".meta.json"));

    for (const metaFile of metaFiles) {
      const metaPath = path.join(tracesDir, metaFile);
      let meta;
      try {
        meta = JSON.parse(await fs.promises.readFile(metaPath, "utf8"));
      } catch (e) {
        console.error(`Failed to read meta file ${metaFile}`, e);
        continue;
      }

      let tracePath = null;
      if (meta.traceFile) {
        tracePath = path.join(tracesDir, meta.traceFile);
      }

      if (tracePath && fs.existsSync(tracePath)) {
        try {
          const traceData = JSON.parse(await fs.promises.readFile(tracePath, "utf8"));
          meta.duration = analyzeTrace(traceData);
          // Save back to meta file to cache it
          await fs.promises.writeFile(metaPath, JSON.stringify(meta, null, 2));
        } catch (e) {
          console.error(`Error analyzing trace ${tracePath}:`, e);
          meta.duration = 0;
        }
      } else {
        if (meta.traceFile) {
            console.warn(`Warning: Trace file ${tracePath} not found for meta ${metaFile}`);
        }
        meta.duration = 0;
      }

      // Add to framework
      const fw = frameworksMap.get(meta.framework);
      if (fw) {
        let bench = fw.benchmarks.find(b => b.name === meta.benchmark);
        if (!bench) {
          bench = { name: meta.benchmark, measurements: [] };
          fw.benchmarks.push(bench);
        }
        bench.measurements.push({
          traceFile: meta.traceFile,
          memory: meta.memory,
          cpu: meta.cpu,
          duration: meta.duration
        });
      }
    }
  }

  // 3. Sort and Format
  const results = Array.from(frameworksMap.values());
  const benchmarkOrder = new Map(allBenchmarks.map((b, i) => [b.name, i]));

  function sortBenchmarksCanonical(a, b) {
    const aIdx = benchmarkOrder.has(a.name) ? benchmarkOrder.get(a.name) : Number.POSITIVE_INFINITY;
    const bIdx = benchmarkOrder.has(b.name) ? benchmarkOrder.get(b.name) : Number.POSITIVE_INFINITY;
    if (aIdx !== bIdx) return aIdx - bIdx;
    return a.name.localeCompare(b.name);
  }

  for (const result of results) {
    // Sort benchmarks
    result.benchmarks.sort(sortBenchmarksCanonical);

    // Sort measurements by run index (inferred from traceFile name usually ending in -N.json)
    // or just leave them as is. Usually order doesn't matter for stats, but nice for stability.
    for (const b of result.benchmarks) {
      b.measurements.sort((m1, m2) => {
        const getRun = (s) => {
          if (!s) return 0;
          return parseInt(s.match(/-(\d+)\.json$/)?.[1] || "0");
        };
        return getRun(m1.traceFile) - getRun(m2.traceFile);
      });
    }
  }

  // Sort frameworks by name
  results.sort((a, b) => a.framework.localeCompare(b.framework));

  const fileContent = `export const results = ${JSON.stringify(results)};`;
  fs.writeFileSync(outputPath, fileContent);

  console.log(`Successfully processed results and wrote to ${outputPath}`);
})();
