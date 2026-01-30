import { Link } from 'react-router-dom';
import type { Result, SortConfig } from '../types';
import { COMPOSITE_NAME, color } from '../utils';
import './BundleTable.css';
import { SortIndicator } from './SortIndicator';

interface BundleTableProps {
  rows: Result[];
  sortConfig: SortConfig<keyof Result>;
  onSort: (key: keyof Result) => void;
}

export const BundleTable = ({ rows, sortConfig, onSort }: BundleTableProps) => {
  return (
    <div className="BundleTable-container">
      <table className="BundleTable-table">
        <thead>
          <tr>
            <th className="BundleTable-th BundleTable-sticky-col"></th>
            <th className="BundleTable-th BundleTable-sortable" onClick={() => onSort('normalCompositeBundle')}>
              <div className="BundleTable-header-content">
                {COMPOSITE_NAME}
                <SortIndicator active={sortConfig.key === 'normalCompositeBundle'} dir={sortConfig.dir} />
              </div>
            </th>
            <th className="BundleTable-th BundleTable-sortable" onClick={() => onSort('rawBundle')}>
              <div className="BundleTable-header-content">
                raw
                <SortIndicator active={sortConfig.key === 'rawBundle'} dir={sortConfig.dir} />
              </div>
            </th>
            <th className="BundleTable-th BundleTable-sortable" onClick={() => onSort('gzipBundle')}>
              <div className="BundleTable-header-content">
                gzip
                <SortIndicator active={sortConfig.key === 'gzipBundle'} dir={sortConfig.dir} />
              </div>
            </th>
            <th className="BundleTable-th BundleTable-sortable" onClick={() => onSort('brotliBundle')}>
              <div className="BundleTable-header-content">
                br
                <SortIndicator active={sortConfig.key === 'brotliBundle'} dir={sortConfig.dir} />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.framework} className="BundleTable-tr">
              <td className="BundleTable-td BundleTable-sticky-col">
                <div className="BundleTable-name-content">
                  <strong>
                    <Link to={`/framework/${row.framework}`} className="BundleTable-link">
                      {row.framework}
                    </Link>
                  </strong>
                  {row.version && <span className="BundleTable-version">v{row.version}</span>}
                </div>
              </td>
              <td className="BundleTable-td" style={{ color: color(row.normalCompositeBundle!) }}>
                {row.normalCompositeBundle?.toFixed(2)}
              </td>
              <td className="BundleTable-td" style={{ color: color(row.normalRawBundle!) }}>
                {(row.rawBundle / 1e3).toFixed(1)}KB <span className="BundleTable-factor">({row.normalRawBundle?.toFixed(2)})</span>
              </td>
              <td className="BundleTable-td" style={{ color: color(row.normalGzipBundle!) }}>
                {(row.gzipBundle / 1e3).toFixed(1)}KB <span className="BundleTable-factor">({row.normalGzipBundle?.toFixed(2)})</span>
              </td>
              <td className="BundleTable-td" style={{ color: color(row.normalBrotliBundle!) }}>
                {(row.brotliBundle / 1e3).toFixed(1)}KB <span className="BundleTable-factor">({row.normalBrotliBundle?.toFixed(2)})</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
