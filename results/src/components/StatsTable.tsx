import type { Result, SortConfig } from '../types';
import './StatsTable.css';
import { SortIndicator } from './SortIndicator';

interface StatsTableProps {
  rows: Result[];
  sortConfig: SortConfig<keyof Result>;
  onSort: (key: keyof Result) => void;
}

const formatNumber = (num: number | undefined) => {
  if (num === undefined) return '-';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const StatsTable = ({ rows, sortConfig, onSort }: StatsTableProps) => {
  return (
    <div className="StatsTable-container">
      <table className="StatsTable-table">
        <thead>
          <tr>
            <th className="StatsTable-th StatsTable-sticky-col"></th>
            <th className="StatsTable-th StatsTable-sortable" onClick={() => onSort('stars')}>
              <div className="StatsTable-header-content">
                Stars
                <SortIndicator active={sortConfig.key === 'stars'} dir={sortConfig.dir} />
              </div>
            </th>
            <th className="StatsTable-th StatsTable-sortable" onClick={() => onSort('downloads')}>
              <div className="StatsTable-header-content">
                Weekly Downloads
                <SortIndicator active={sortConfig.key === 'downloads'} dir={sortConfig.dir} />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.framework} className="StatsTable-tr">
              <td className="StatsTable-td StatsTable-sticky-col">
                <div className="StatsTable-name-content">
                  <strong>
                    {row.website ? (
                      <a href={row.website} target="_blank" rel="noopener noreferrer" className="StatsTable-link">
                        {row.framework}
                      </a>
                    ) : (
                      row.framework
                    )}
                  </strong>
                  {row.version && <span className="StatsTable-version">v{row.version}</span>}
                </div>
              </td>
              <td className="StatsTable-td">
                {formatNumber(row.stars)}
              </td>
              <td className="StatsTable-td">
                {formatNumber(row.downloads)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
