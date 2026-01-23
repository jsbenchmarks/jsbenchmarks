import type { Result, SortConfig } from '../types';
import { COMPOSITE_NAME, color } from '../utils';
import './MemoryTable.css';
import { SortIndicator } from './SortIndicator';

interface MemoryTableProps {
  rows: Result[];
  benchmarkNames: string[];
  sortConfig: SortConfig<string>;
  onSort: (name: string) => void;
}

export const MemoryTable = ({ rows, benchmarkNames, sortConfig, onSort }: MemoryTableProps) => {
  return (
    <div className="MemoryTable-container">
      <table className="MemoryTable-table">
        <thead>
          <tr>
            <th className="MemoryTable-th MemoryTable-sticky-col"></th>
            {benchmarkNames.map(name => (
              <th
                key={name}
                className="MemoryTable-th MemoryTable-sortable"
                onClick={() => onSort(name)}
              >
                <div className="MemoryTable-header-content">
                  {name}
                  <SortIndicator active={sortConfig.key === name} dir={sortConfig.dir} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.framework} className="MemoryTable-tr">
              <td className="MemoryTable-td MemoryTable-sticky-col">
                <div className="MemoryTable-name-content">
                  <strong>
                    {row.website ? (
                      <a href={row.website} target="_blank" rel="noopener noreferrer" className="MemoryTable-link">
                        {row.framework}
                      </a>
                    ) : (
                      row.framework
                    )}
                  </strong>
                  {row.version && <span className="MemoryTable-version">v{row.version}</span>}
                </div>
              </td>
              {row.benchmarks.map(bm => (
                <td
                  key={bm.name}
                  className="MemoryTable-td"
                  style={{ color: color(bm.normalMemory!) }}
                >
                  {bm.memory ? ` ${(bm.memory / 1e6).toFixed(1)} ± ${(bm.memoryMOE! / 1e6).toFixed(2)} ` : ""}
                  {bm.name === COMPOSITE_NAME
                    ? `${bm.normalMemory?.toFixed(2)}`
                    : `(${bm.normalMemory?.toFixed(2)})`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
