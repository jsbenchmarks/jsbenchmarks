import * as fs from "fs";
import * as path from "path";

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

  if (!clickEvent || !markEvent) return Infinity;

  // 1. Primary check: Look for a Paint event (standard behavior)
  let targetEvent = events.find(e => 
    e.name === 'Paint' && 
    e.ts >= markEvent.ts
  );

  // 2. Fallback: Look for a Commit event
  // Modern Chrome often skips 'Paint' if only the Layer Tree needs updating
  if (!targetEvent) {
    targetEvent = events.find(e => 
      e.name === 'Commit' && 
      e.ts >= markEvent.ts
    );
  }

  // 3. Final Fallback: CompositeLayers
  if (!targetEvent) {
    targetEvent = events.find(e => 
      e.name === 'CompositeLayers' && 
      e.ts >= markEvent.ts
    );
  }

  if (!targetEvent) return Infinity;

  // Use the end of the event duration
  return (targetEvent.ts + (targetEvent.dur || 0) - clickEvent.ts) / 1000;
}

(async () => {
  const rawDataPath = "results/raw-data.json";
  const tracesDir = "results/traces";
  
  if (!fs.existsSync(rawDataPath)) {
    console.error(`Error: ${rawDataPath} not found. Run 'npm run bench' first.`);
    process.exit(1);
  }

  const rawResults = JSON.parse(fs.readFileSync(rawDataPath, "utf8"));
  
  console.log("Processing results...");

  for (const result of rawResults) {
    for (const benchmark of result.benchmarks) {
      for (const measurement of benchmark.measurements) {
        if (measurement.traceFile) {
          const tracePath = path.join(tracesDir, measurement.traceFile);
          
          try {
            if (fs.existsSync(tracePath)) {
              const traceData = JSON.parse(fs.readFileSync(tracePath, "utf8"));
              const duration = analyzeTrace(traceData);
              measurement.duration = duration;
              // Remove traceFile from final output to keep it clean, or keep it if needed for debugging
              // measurement.traceFile = undefined; 
            } else {
              console.warn(`Warning: Trace file ${tracePath} not found.`);
              measurement.duration = 0;
            }
          } catch (e) {
            console.error(`Error analyzing trace ${tracePath}:`, e);
            measurement.duration = 0;
          }
        }
      }
    }
  }

  const outputPath = "results/src/data.ts";
  const fileContent = `export const results = ${JSON.stringify(rawResults)};`;
  fs.writeFileSync(outputPath, fileContent);
  
  console.log(`Successfully processed results and wrote to ${outputPath}`);
})();
