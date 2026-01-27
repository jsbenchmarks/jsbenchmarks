import { Link } from 'react-router-dom';
import type { Result, SortConfig } from '../types';
import { COMPOSITE_NAME, color } from '../utils';
import { SortIndicator } from './SortIndicator';
import './StatsTable.css';

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
            <th className="StatsTable-th StatsTable-sortable" onClick={() => onSort('normalCompositeStats')}>
              <div className="StatsTable-header-content">
                {COMPOSITE_NAME}
                <SortIndicator active={sortConfig.key === 'normalCompositeStats'} dir={sortConfig.dir} />
              </div>
            </th>
            <th className="StatsTable-th StatsTable-sortable" onClick={() => onSort('stars')}>
              <div className="StatsTable-header-content">
                github stars
                <SortIndicator active={sortConfig.key === 'stars'} dir={sortConfig.dir} />
              </div>
            </th>
            <th className="StatsTable-th StatsTable-sortable" onClick={() => onSort('downloads')}>
              <div className="StatsTable-header-content">
                weekly npm downloads
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
                    <Link to={`/framework/${row.framework}`} className="StatsTable-link">
                      {row.framework}
                    </Link>
                  </strong>
                  {row.version && <span className="StatsTable-version">v{row.version}</span>}
                </div>
              </td>
              <td className="StatsTable-td" style={{ color: color(row.normalCompositeStats!) }}>
                {row.normalCompositeStats?.toFixed(2)}
              </td>
              <td className="StatsTable-td" style={{ color: color(row.normalStars!) }}>
                {formatNumber(row.stars)}
              </td>
              <td className="StatsTable-td" style={{ color: color(row.normalDownloads!) }}>
                {formatNumber(row.downloads)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
