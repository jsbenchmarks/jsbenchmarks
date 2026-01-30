import * as fs from "fs";
import * as path from "path";
import { benchmarks as allBenchmarks } from "./tests.js";
import { analyzeTrace } from './trace.js';

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
    result.benchmarks.sort(sortBenchmarksCanonical);
  }

  const fileContent = `export const results = ${JSON.stringify(results)};`;
  fs.writeFileSync(outputPath, fileContent);

  console.log(`Successfully processed results and wrote to ${outputPath}`);
})();
