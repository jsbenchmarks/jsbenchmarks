export interface Measurement {
  duration: number;
  memory: number;
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
  normalDuration?: number;
  normalMemory?: number;
}

export interface RawResult {
  framework: string;
  benchmarks: Benchmark[];
  gzipBundle: number;
  rawBundle: number;
  brotliBundle: number;
  website?: string;
  version?: string;
}

export interface Result extends RawResult {
  normalGzipBundle?: number;
  normalRawBundle?: number;
  normalBrotliBundle?: number;
  normalCompositeBundle?: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: T;
  dir: SortDirection;
}
