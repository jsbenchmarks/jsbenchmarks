import type { Measurement, RawResult, Result } from "./types";

export const COMPOSITE_NAME = "mean";

export function color(norm: number): string {
  if (norm >= 10) return "oklch(80% 0.1 300)";
  if (norm <= 1) return "oklch(80% 0.1 140)";

  // [value, hue]
  const points = [
    [1, 140],   // Green
    [1.75, 20],    // Red
    [3, 0],     // Deep Red / Pinkish
    [7.5, -15], // Magenta
    [10, -30]   // Purple
  ];

  for (let i = 0; i < points.length - 1; i++) {
    const [p1, h1] = points[i];
    const [p2, h2] = points[i + 1];
    if (norm <= p2) {
      const logNorm = Math.log(norm);
      const logP1 = Math.log(p1);
      const logP2 = Math.log(p2);
      const ratio = (logNorm - logP1) / (logP2 - logP1);
      const hue = h1 + (h2 - h1) * ratio;
      return `oklch(80% 0.1 ${hue})`;
    }
  }
  return "oklch(80% 0.1 300)";
}

export function calculateResults(input: RawResult[], selectedBenchmarks?: Set<string>): Result[] {
  const results: Result[] = input.map(result => ({
    ...result,
    version: result.framework === 'vanillajs' ? undefined : result.version,
    benchmarks: result.benchmarks
      .map(bm => ({
        ...bm,
        measurements: bm.measurements.map(m => ({ ...m })),
      })),
  }));

  const bestDurs: Record<string, number> = {};
  const bestMems: Record<string, number> = {};
  const bestCpus: Record<string, number> = {};
  let bestGzipBund = 1e12;
  let bestRawBund = 1e12;
  let bestBrotliBund = 1e12;
  let maxStars = 0;
  let maxDownloads = 0;
  let maxRecentCommits = 0;

  for (const result of results) {
    for (const bm of result.benchmarks) {
      const sampleSize = bm.measurements.length;
      let measurements: { duration: Measurement[], memory: Measurement[] };
      let effectiveSampleSize = sampleSize;

      if (sampleSize >= 8) {
        const sortedByDuration = [...bm.measurements].sort((a, b) => a.duration - b.duration);
        const trimmedDuration = sortedByDuration.slice(0, -2);
        const sortedByMemory = [...bm.measurements].sort((a, b) => a.memory - b.memory);
        const trimmedMemory = sortedByMemory.slice(0, -2);
        measurements = { duration: trimmedDuration, memory: trimmedMemory };
        effectiveSampleSize = trimmedDuration.length;
      } else {
        measurements = { duration: bm.measurements, memory: bm.measurements };
      }

      bm.duration = measurements.duration.reduce((sum, cur) => sum + cur.duration, 0) / Math.max(1, effectiveSampleSize);
      const durvar = effectiveSampleSize > 1
        ? measurements.duration.reduce((sum, cur) => sum + Math.pow(cur.duration - bm.duration!, 2), 0) / (effectiveSampleSize - 1)
        : 0;
      bm.durationStdDev = Math.sqrt(durvar);
      const zScore95 = 1.96;
      const durationSEM = effectiveSampleSize > 0 ? (bm.durationStdDev / Math.sqrt(effectiveSampleSize)) : 0;
      bm.durationMOE = zScore95 * durationSEM;

      bm.memory = measurements.memory.reduce((sum, cur) => sum + cur.memory, 0) / Math.max(1, effectiveSampleSize);
      const memvar = effectiveSampleSize > 1
        ? measurements.memory.reduce((sum, cur) => sum + Math.pow(cur.memory - bm.memory!, 2), 0) / (effectiveSampleSize - 1)
        : 0;
      bm.memoryStdDev = Math.sqrt(memvar);
      const memorySEM = effectiveSampleSize > 0 ? (bm.memoryStdDev / Math.sqrt(effectiveSampleSize)) : 0;
      bm.memoryMOE = zScore95 * memorySEM;

      // CPU
      const cpuMeasurements = bm.measurements.filter(m => m.cpu !== undefined);
       if (cpuMeasurements.length > 0) {
         bm.cpu = cpuMeasurements.reduce((sum, cur) => sum + (cur.cpu || 0), 0) / cpuMeasurements.length;
        const cpuVar = cpuMeasurements.length > 1
          ? cpuMeasurements.reduce((sum, cur) => sum + Math.pow((cur.cpu || 0) - bm.cpu!, 2), 0) / (cpuMeasurements.length - 1)
          : 0;
        bm.cpuStdDev = Math.sqrt(cpuVar);
        const cpuSEM = bm.cpuStdDev / Math.sqrt(cpuMeasurements.length);
        bm.cpuMOE = zScore95 * cpuSEM;
         if (bm.cpu > 0) {
           bestCpus[bm.name] = Math.min(bestCpus[bm.name] ?? 1e12, bm.cpu);
         }
       }

       if (bm.duration > 0) {
         bestDurs[bm.name] = Math.min(bestDurs[bm.name] ?? 1e12, bm.duration);
       }
       if (bm.memory > 0) {
         bestMems[bm.name] = Math.min(bestMems[bm.name] ?? 1e12, bm.memory);
       }
     }
    bestGzipBund = Math.min(bestGzipBund, result.gzipBundle);
    bestRawBund = Math.min(bestRawBund, result.rawBundle);
    bestBrotliBund = Math.min(bestBrotliBund, result.brotliBundle);
    maxStars = Math.max(maxStars, result.stars ?? 0);
    maxDownloads = Math.max(maxDownloads, result.downloads ?? 0);
    maxRecentCommits = Math.max(maxRecentCommits, result.recentCommits ?? 0);
  }

  for (const result of results) {
    let totalDurNorm = 1;
    let totalMemNorm = 1;
    let totalCpuNorm = 1;
    let durCount = 0;
    let memCount = 0;
    let cpuCount = 0;
    const durRelMOEs: number[] = [];
    const memRelMOEs: number[] = [];
    const cpuRelMOEs: number[] = [];
    for (const bm of result.benchmarks) {
      const isSelected = !selectedBenchmarks || selectedBenchmarks.has(bm.name);

      if (bm.duration && bestDurs[bm.name]) {
        bm.normalDuration = bm.duration / bestDurs[bm.name];
        
        if (isSelected) {
          totalDurNorm *= bm.normalDuration;
          durCount++;

          if (bm.durationMOE !== undefined && bm.duration > 0 && bm.durationMOE > 0) {
            durRelMOEs.push(bm.durationMOE / bm.duration);
          }
        }
      }
      if (bm.memory && bestMems[bm.name]) {
        bm.normalMemory = bm.memory / bestMems[bm.name];
        
        if (isSelected) {
          totalMemNorm *= bm.normalMemory;
          memCount++;

          if (bm.memoryMOE !== undefined && bm.memory > 0 && bm.memoryMOE > 0) {
            memRelMOEs.push(bm.memoryMOE / bm.memory);
          }
        }
      }
      if (bm.cpu !== undefined && bestCpus[bm.name]) {
        bm.normalCpu = bm.cpu / bestCpus[bm.name];
        
        if (isSelected) {
          totalCpuNorm *= bm.normalCpu;
          cpuCount++;

          if (bm.cpuMOE !== undefined && bm.cpu > 0 && bm.cpuMOE > 0) {
              cpuRelMOEs.push(bm.cpuMOE / bm.cpu);
          }
        }
      }
    }

    const compositeNormalDuration = durCount > 0 ? Math.pow(totalDurNorm, 1 / durCount) : 0;
    const compositeNormalMemory = memCount > 0 ? Math.pow(totalMemNorm, 1 / memCount) : 0;
    const compositeNormalCpu = cpuCount > 0 ? Math.pow(totalCpuNorm, 1 / cpuCount) : 0;

    // Relative MOE of the Geometric Mean = (1/n) * sqrt(sum(relativeMOE^2))
    const durRelMOESumSq = durRelMOEs.reduce((sum, r) => sum + r * r, 0);
    const compositeDurationMOE = durCount > 0
      ? compositeNormalDuration * (Math.sqrt(durRelMOESumSq) / durCount)
      : 0;

    const memRelMOESumSq = memRelMOEs.reduce((sum, r) => sum + r * r, 0);
    const compositeMemoryMOE = memCount > 0
      ? compositeNormalMemory * (Math.sqrt(memRelMOESumSq) / memCount)
      : 0;
    
    const cpuRelMOESumSq = cpuRelMOEs.reduce((sum, r) => sum + r * r, 0);
    const compositeCpuMOE = cpuCount > 0 ? compositeNormalCpu * (Math.sqrt(cpuRelMOESumSq) / cpuCount) : 0;

    result.benchmarks.unshift({
      name: COMPOSITE_NAME,
      measurements: [],
      normalDuration: compositeNormalDuration,
      normalMemory: compositeNormalMemory,
      normalCpu: compositeNormalCpu,
      normalDurationMOE: compositeDurationMOE,
      normalMemoryMOE: compositeMemoryMOE,
      normalCpuMOE: compositeCpuMOE,
      duration: 0,
      memory: 0,
      cpu: 0,
      durationMOE: 0,
      memoryMOE: 0,
      cpuMOE: 0
    });
    result.normalGzipBundle = result.gzipBundle / bestGzipBund;
    result.normalRawBundle = result.rawBundle / bestRawBund;
    result.normalBrotliBundle = result.brotliBundle / bestBrotliBund;
    result.normalCompositeBundle = Math.pow(
      result.normalGzipBundle * result.normalRawBundle * result.normalBrotliBundle,
      1 / 3
    );

    result.normalStars = maxStars / Math.max(1, result.stars ?? 0);
    result.normalDownloads = maxDownloads / Math.max(1, result.downloads ?? 0);
    result.normalRecentCommits = maxRecentCommits / Math.max(1, result.recentCommits ?? 0);
    result.normalCompositeStats = Math.pow(
      result.normalStars * result.normalDownloads * result.normalRecentCommits,
      1 / 3
    );
  }
  return results;
}
