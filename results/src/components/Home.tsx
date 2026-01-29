import { useMemo, useState } from 'react';
import { results as rawResults } from '../data';
import type { RawResult, Result, SortConfig } from '../types';
import { calculateResults, COMPOSITE_NAME } from '../utils';
import { BenchmarkFilter } from './BenchmarkFilter';
import { BundleTable } from './BundleTable';
import { DurationTable } from './DurationTable';
import { LoadTable, type LoadSortKey } from './LoadTable';
import { MemoryTable } from './MemoryTable';
import { StatsTable } from './StatsTable';

const inputData = rawResults as RawResult[];
const allBenchmarkNames = (() => {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const r of inputData) {
    for (const b of r.benchmarks) {
      if (seen.has(b.name)) continue;
      seen.add(b.name);
      ordered.push(b.name);
    }
  }
  return ordered;
})();

export function Home() {
  const [durationSort, setDurationSort] = useState<SortConfig<string>>({ key: COMPOSITE_NAME, dir: 'asc' });
  const [memorySort, setMemorySort] = useState<SortConfig<string>>({ key: COMPOSITE_NAME, dir: 'asc' });
  const [loadSort, setLoadSort] = useState<SortConfig<LoadSortKey>>({ key: COMPOSITE_NAME, dir: 'asc' });

  const [bundleSort, setBundleSort] = useState<SortConfig<keyof Result>>({ key: 'normalCompositeBundle', dir: 'asc' });
  const [statsSort, setStatsSort] = useState<SortConfig<keyof Result>>({ key: 'normalCompositeStats', dir: 'asc' });

  const [selectedBenchmarks, setSelectedBenchmarks] = useState<Set<string>>(new Set(allBenchmarkNames));

  const baseRows = useMemo(() => calculateResults(inputData, selectedBenchmarks), [selectedBenchmarks]);

  const handleDurationSort = (name: string) => {
    setDurationSort(prev => ({
      key: name,
      dir: prev.key === name && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleMemorySort = (name: string) => {
    setMemorySort(prev => ({
      key: name,
      dir: prev.key === name && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleLoadSort = (key: LoadSortKey) => {
    setLoadSort(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleBundleSort = (key: keyof Result) => {
    setBundleSort(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleStatsSort = (key: keyof Result) => {
    setStatsSort(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleBenchmarkToggle = (name: string) => {
    setSelectedBenchmarks(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleSelectAll = () => setSelectedBenchmarks(new Set(allBenchmarkNames));
  const handleSelectNone = () => setSelectedBenchmarks(new Set());

  const durationRows = useMemo(() => {
    const copy = [...baseRows];
    copy.sort((a, b) => {
      const aVal = a.benchmarks.find(t => t.name === durationSort.key)?.normalDuration ?? 0;
      const bVal = b.benchmarks.find(t => t.name === durationSort.key)?.normalDuration ?? 0;
      return durationSort.dir === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
    });
    return copy;
  }, [baseRows, durationSort]);

  const memoryRows = useMemo(() => {
    const copy = [...baseRows];
    copy.sort((a, b) => {
      const aVal = a.benchmarks.find(t => t.name === memorySort.key)?.normalMemory ?? 0;
      const bVal = b.benchmarks.find(t => t.name === memorySort.key)?.normalMemory ?? 0;
      return memorySort.dir === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
    });
    return copy;
  }, [baseRows, memorySort]);

  const { loadBenchmarks, standardBenchmarks } = useMemo(() => {
    const load: string[] = [];
    const standard: string[] = [];
    
    for (const name of allBenchmarkNames) {
      if (!selectedBenchmarks.has(name)) continue;
      
      // Identify load tests by checking if any result has CPU data for this benchmark
      const isLoad = baseRows.some(r => r.benchmarks.find(b => b.name === name)?.cpu !== undefined);
      
      if (isLoad) {
        load.push(name);
      } else {
        standard.push(name);
      }
    }
    return { loadBenchmarks: load, standardBenchmarks: standard };
  }, [baseRows, selectedBenchmarks]);

  const loadRows = useMemo(() => {
    const copy = [...baseRows];
    copy.sort((a, b) => {
      if (loadSort.key === COMPOSITE_NAME) {
          const calculateLoadMean = (r: Result) => {
             let prodCpu = 1; 
             let countCpu = 0;
             let prodMem = 1;
             let countMem = 0;
             
             for (const lb of loadBenchmarks) {
                 const bm = r.benchmarks.find(b => b.name === lb);
                 if (bm?.normalCpu) {
                     prodCpu *= bm.normalCpu;
                     countCpu++;
                 }
                 if (bm?.normalMemory) {
                     prodMem *= bm.normalMemory;
                     countMem++;
                 }
             }
             const aggCpu = countCpu > 0 ? Math.pow(prodCpu, 1/countCpu) : 0;
             const aggMem = countMem > 0 ? Math.pow(prodMem, 1/countMem) : 0;
             
             return (aggCpu && aggMem) ? Math.sqrt(aggCpu * aggMem) : Number.POSITIVE_INFINITY;
          };

          const aVal = calculateLoadMean(a);
          const bVal = calculateLoadMean(b);
          return loadSort.dir === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
      }
      
      const [name, metric] = loadSort.key.split('|') as [string, 'cpu' | 'memory'];
      const aBm = a.benchmarks.find(t => t.name === name);
      const bBm = b.benchmarks.find(t => t.name === name);
      const aVal = metric === 'cpu'
        ? (aBm?.normalCpu ?? Number.POSITIVE_INFINITY)
        : (aBm?.normalMemory ?? Number.POSITIVE_INFINITY);
      const bVal = metric === 'cpu'
        ? (bBm?.normalCpu ?? Number.POSITIVE_INFINITY)
        : (bBm?.normalMemory ?? Number.POSITIVE_INFINITY);
      return loadSort.dir === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
    });
    return copy;
  }, [baseRows, loadSort]);

  const bundleRows = useMemo(() => {
    const copy = [...baseRows];
    copy.sort((a, b) => {
        const aVal = a[bundleSort.key] ?? 0;
        const bVal = b[bundleSort.key] ?? 0;
        return bundleSort.dir === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
    });
    return copy;
  }, [baseRows, bundleSort]);

  const statsRows = useMemo(() => {
    const copy = baseRows.filter(r => r.framework !== 'vanillajs');
    copy.sort((a, b) => {
        const aVal = a[statsSort.key] ?? 0;
        const bVal = b[statsSort.key] ?? 0;
        return statsSort.dir === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
    });
    return copy;
  }, [baseRows, statsSort]);

  const durationTableNames = useMemo(() => [COMPOSITE_NAME, ...standardBenchmarks], [standardBenchmarks]);
  const memoryTableNames = useMemo(() => [COMPOSITE_NAME, ...standardBenchmarks], [standardBenchmarks]);
  const loadTableNames = useMemo(() => [COMPOSITE_NAME, ...loadBenchmarks], [loadBenchmarks]);

  return (
    <main className="App-main">
      <header className="App-header">
        <h1 className="App-h1">JS Benchmarks Results</h1>
        <div className="App-header-info">
          <p className="App-p">
            <strong>System:</strong> Linux / Chrome 144
          </p>
          <p className="App-p">
            <strong>Candidates:</strong> Very popular or very fast frameworks.
            Purely data-driven (no direct DOM manipulation or anything that would warrant a flag).
          </p>
          <p className="App-p">
            <strong>Purpose:</strong> To provide a more thorough benchmark.
          </p>
          <p className="App-p">
            <strong>Repository:</strong> <a className="App-link" href="https://github.com/jsbenchmarks/jsbenchmarks">https://github.com/jsbenchmarks/jsbenchmarks</a>
          </p>
        </div>
      </header>
      
      <BenchmarkFilter
        benchmarks={allBenchmarkNames}
        selected={selectedBenchmarks}
        onChange={handleBenchmarkToggle}
        onSelectAll={handleSelectAll}
        onSelectNone={handleSelectNone}
      />

      <h2 className="App-h2">Duration in ms ± 95% confidence interval</h2>
      <DurationTable
        rows={durationRows}
        benchmarkNames={durationTableNames}
        sortConfig={durationSort}
        onSort={handleDurationSort}
      />
      <h2 className="App-h2">Memory in MB ± 95% confidence interval</h2>
      <MemoryTable
        rows={memoryRows}
        benchmarkNames={memoryTableNames}
        sortConfig={memorySort}
        onSort={handleMemorySort}
      />
      {loadBenchmarks.length > 0 && (
        <>
          <h2 className="App-h2">Load Test (Stream updates for 60 seconds)</h2>
          <LoadTable
            rows={loadRows}
            benchmarkNames={loadTableNames}
            sortConfig={loadSort}
            onSort={handleLoadSort}
          />
        </>
      )}
      <h2 className="App-h2">Bundle Size</h2>
      <BundleTable
        rows={bundleRows}
        sortConfig={bundleSort}
        onSort={handleBundleSort}
      />
      <h2 className="App-h2">Popularity</h2>
      <StatsTable
        rows={statsRows}
        sortConfig={statsSort}
        onSort={handleStatsSort}
      />
    </main>
  );
}
