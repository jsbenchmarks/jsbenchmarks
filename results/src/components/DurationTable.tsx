import type { Result, SortConfig } from '../types';
import { COMPOSITE_NAME, color } from '../utils';
import './DurationTable.css';
import { SortIndicator } from './SortIndicator';

interface DurationTableProps {
  rows: Result[];
  benchmarkNames: string[];
  sortConfig: SortConfig<string>;
  onSort: (name: string) => void;
}

export const DurationTable = ({ rows, benchmarkNames, sortConfig, onSort }: DurationTableProps) => {
  return (
    <div className="DurationTable-container">
      <table className="DurationTable-table">
        <thead>
          <tr>
            <th className="DurationTable-th DurationTable-sticky-col"></th>
            {benchmarkNames.map(name => (
              <th
                key={name}
                className="DurationTable-th DurationTable-sortable"
                onClick={() => onSort(name)}
              >
                <div className="DurationTable-header-content">
                  {name}
                  <SortIndicator active={sortConfig.key === name} dir={sortConfig.dir} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.framework} className="DurationTable-tr">
              <td className="DurationTable-td DurationTable-sticky-col">
                <div className="DurationTable-name-content">
                  <strong>
                    {row.website ? (
                      <a href={row.website} target="_blank" rel="noopener noreferrer" className="DurationTable-link">
                        {row.framework}
                      </a>
                    ) : (
                      row.framework
                    )}
                  </strong>
                  {row.version && <span className="DurationTable-version">v{row.version}</span>}
                </div>
              </td>
              {row.benchmarks.map(bm => (
                <td
                  key={bm.name}
                  className="DurationTable-td"
                  style={{ color: color(bm.normalDuration!) }}
                >
                  {bm.duration ? `${bm.duration.toFixed(1)} ± ${bm.durationMOE?.toFixed(1)} ` : ""}
                  {bm.name === COMPOSITE_NAME
                    ? `${bm.normalDuration?.toFixed(2)}${bm.normalDurationMOE !== undefined ? ` (±${bm.normalDurationMOE.toFixed(3)})` : ''}`
                    : `(${bm.normalDuration?.toFixed(2)})`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
