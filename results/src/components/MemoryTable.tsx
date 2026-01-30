import { Link } from 'react-router-dom';
import type { Result, SortConfig } from '../types';
import { COMPOSITE_NAME, color } from '../utils';
import './MemoryTable.css';
import { SortIndicator } from './SortIndicator';

interface MemoryTableProps {
  rows: Result[];
  benchmarkNames: string[];
  sortConfig: SortConfig<string>;
  onSort: (name: string) => void;
  selectedBenchmarks: Set<string>;
  onBenchmarkToggle: (name: string) => void;
}

export const MemoryTable = ({ rows, benchmarkNames, sortConfig, onSort, selectedBenchmarks, onBenchmarkToggle }: MemoryTableProps) => {
  return (
    <div className="MemoryTable-container">
      <table className="MemoryTable-table">
        <thead>
          <tr>
            <th className="MemoryTable-th MemoryTable-sticky-col"></th>
            {benchmarkNames.map(name => (
              <th
                key={name}
                className={`MemoryTable-th MemoryTable-sortable ${name === COMPOSITE_NAME ? 'MemoryTable-mean-col' : ''}`}
                onClick={() => onSort(name)}
              >
                <div className="MemoryTable-header-content">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {name !== COMPOSITE_NAME && (
                      <input
                        type="checkbox"
                        checked={selectedBenchmarks.has(name)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => onBenchmarkToggle(name)}
                        className="MemoryTable-checkbox"
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                    {name}
                  </span>
                  <SortIndicator active={sortConfig.key === name} dir={sortConfig.dir} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const byName = new Map(row.benchmarks.map(b => [b.name, b]));
            return (
              <tr key={row.framework} className="MemoryTable-tr">
                <td className="MemoryTable-td MemoryTable-sticky-col">
                  <div className="MemoryTable-name-content">
                    <strong>
                      <Link to={`/framework/${row.framework}`} className="MemoryTable-link">
                        {row.framework}
                      </Link>
                    </strong>
                    {row.version && <span className="MemoryTable-version">v{row.version}</span>}
                  </div>
                </td>
                {benchmarkNames.map(name => {
                  const bm = byName.get(name);
                  const isSelected = name === COMPOSITE_NAME || selectedBenchmarks.has(name);
                  const norm = bm?.normalMemory;
                  return (
                    <td
                      key={name}
                      className={`MemoryTable-td ${name === COMPOSITE_NAME ? 'MemoryTable-mean-col' : ''}`}
                      style={isSelected && norm ? { color: color(norm) } : { color: '#888' }}
                    >
                      {bm?.memory ? ` ${(bm.memory / 1e6).toFixed(1)} ± ${(bm.memoryMOE! / 1e6).toFixed(2)} ` : ""}
                      {bm?.name === COMPOSITE_NAME
                        ? (bm?.normalMemory ? `${bm.normalMemory.toFixed(2)}${bm.normalMemoryMOE !== undefined ? ` ± ${bm.normalMemoryMOE.toFixed(2)}` : ''}` : "")
                        : (bm?.normalMemory ? <span className="MemoryTable-factor">({bm.normalMemory.toFixed(2)})</span> : "")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
