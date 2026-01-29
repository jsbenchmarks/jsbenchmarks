import { Link } from 'react-router-dom';
import type { Result, SortConfig } from '../types';
import { COMPOSITE_NAME, color } from '../utils';
import './DurationTable.css';
import { SortIndicator } from './SortIndicator';

interface DurationTableProps {
  rows: Result[];
  benchmarkNames: string[];
  sortConfig: SortConfig<string>;
  onSort: (name: string) => void;
  selectedBenchmarks: Set<string>;
  onBenchmarkToggle: (name: string) => void;
}

export const DurationTable = ({ rows, benchmarkNames, sortConfig, onSort, selectedBenchmarks, onBenchmarkToggle }: DurationTableProps) => {
  return (
    <div className="DurationTable-container">
      <table className="DurationTable-table">
        <thead>
          <tr>
            <th className="DurationTable-th DurationTable-sticky-col"></th>
            {benchmarkNames.map(name => (
              <th
                key={name}
                className={`DurationTable-th DurationTable-sortable ${name === COMPOSITE_NAME ? 'DurationTable-mean-col' : ''}`}
                onClick={() => onSort(name)}
              >
                <div className="DurationTable-header-content">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {name !== COMPOSITE_NAME && (
                      <input
                        type="checkbox"
                        checked={selectedBenchmarks.has(name)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => onBenchmarkToggle(name)}
                        className="DurationTable-checkbox"
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
              <tr key={row.framework} className="DurationTable-tr">
                <td className="DurationTable-td DurationTable-sticky-col">
                  <div className="DurationTable-name-content">
                    <strong>
                      <Link to={`/framework/${row.framework}`} className="DurationTable-link">
                        {row.framework}
                      </Link>
                    </strong>
                    {row.version && <span className="DurationTable-version">v{row.version}</span>}
                  </div>
                </td>
                {benchmarkNames.map(name => {
                  const bm = byName.get(name);
                  const isSelected = name === COMPOSITE_NAME || selectedBenchmarks.has(name);
                  const norm = bm?.normalDuration;
                  return (
                    <td
                      key={name}
                      className={`DurationTable-td ${name === COMPOSITE_NAME ? 'DurationTable-mean-col' : ''}`}
                      style={isSelected && norm ? { color: color(norm) } : { color: '#888' }}
                    >
                      {bm?.duration ? `${bm.duration.toFixed(1)} ± ${bm.durationMOE?.toFixed(1)} ` : ""}
                      {bm?.name === COMPOSITE_NAME
                        ? (bm?.normalDuration ? `${bm.normalDuration.toFixed(2)}${bm.normalDurationMOE !== undefined ? ` ± ${bm.normalDurationMOE.toFixed(2)}` : ''}` : "")
                        : (bm?.normalDuration ? `(${bm.normalDuration.toFixed(2)})` : "")}
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
