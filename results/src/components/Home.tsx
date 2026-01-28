import { useMemo, useState } from 'react';
import { BundleTable } from './BundleTable';
import { StatsTable } from './StatsTable';
import { DurationTable } from './DurationTable';
import { MemoryTable } from './MemoryTable';
import { BenchmarkFilter } from './BenchmarkFilter';
import { results as rawResults } from '../data';
import type { RawResult, Result, SortConfig } from '../types';
import { calculateResults, COMPOSITE_NAME } from '../utils';

const inputData = rawResults as RawResult[];
const allBenchmarkNames = inputData[0].benchmarks.map(b => b.name);

export function Home() {
  const [durationSort, setDurationSort] = useState<SortConfig<string>>({ key: COMPOSITE_NAME, dir: 'asc' });
  const [memorySort, setMemorySort] = useState<SortConfig<string>>({ key: COMPOSITE_NAME, dir: 'asc' });

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

  const benchmarkNames = baseRows[0]?.benchmarks.map(b => b.name) ?? [];

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
        benchmarkNames={benchmarkNames}
        sortConfig={durationSort}
        onSort={handleDurationSort}
      />
      <h2 className="App-h2">Memory in MB ± 95% confidence interval</h2>
      <MemoryTable
        rows={memoryRows}
        benchmarkNames={benchmarkNames}
        sortConfig={memorySort}
        onSort={handleMemorySort}
      />
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
