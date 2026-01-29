export interface Measurement {
  duration: number;
  memory: number;
  cpu?: number;
  traceFile: string;
}

export interface Benchmark {
  name: string;
  measurements: Measurement[];
  duration?: number;
  durationStdDev?: number;
  durationMOE?: number;
  memory?: number;
  memoryStdDev?: number;
  memoryMOE?: number;
  cpu?: number;
  cpuStdDev?: number;
  cpuMOE?: number;
  normalDuration?: number;
  normalMemory?: number;
  normalCpu?: number;
  normalDurationMOE?: number;
  normalMemoryMOE?: number;
  normalCpuMOE?: number;
}

export interface RawResult {
  framework: string;
  benchmarks: Benchmark[];
  gzipBundle: number;
  rawBundle: number;
  brotliBundle: number;
  website?: string;
  version?: string;
  stars?: number;
  downloads?: number;
  gitHubUrl?: string;
}

export interface Result extends RawResult {
  normalGzipBundle?: number;
  normalRawBundle?: number;
  normalBrotliBundle?: number;
  normalCompositeBundle?: number;
  normalStars?: number;
  normalDownloads?: number;
  normalCompositeStats?: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: T;
  dir: SortDirection;
}
