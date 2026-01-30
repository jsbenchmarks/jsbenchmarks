import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import type { Result, SortConfig } from '../types';
import { color, COMPOSITE_NAME } from '../utils';
import './LoadTable.css';
import { SortIndicator } from './SortIndicator';

type LoadMetric = 'cpu' | 'memory';

export type LoadSortKey = string;

interface LoadTableProps {
  rows: Result[];
  benchmarkNames: string[];
  sortConfig: SortConfig<LoadSortKey>;
  onSort: (key: LoadSortKey) => void;
}

function formatCpu(v?: number): string {
  if (v === undefined) return '—';
  return `${v.toFixed(1)}%`;
}

function formatMemMB(bytes?: number): string {
  if (!bytes) return '—';
  return `${(bytes / 1e6).toFixed(1)}MB`;
}

function cellColor(metric: LoadMetric, bm: any): string | undefined {
  const n = metric === 'cpu' ? bm?.normalCpu : bm?.normalMemory;
  return typeof n === 'number' && n > 0 ? color(n) : undefined;
}

export const LoadTable = ({ rows, benchmarkNames, sortConfig, onSort }: LoadTableProps) => {
  if (benchmarkNames.length === 0) return null;

  return (
    <div className="LoadTable-container">
      <table className="LoadTable-table">
        <thead>
          <tr>
            <th className="LoadTable-th LoadTable-sticky-col"></th>
            {benchmarkNames.map(name => {
              if (name === COMPOSITE_NAME) {
                return (
                  <th
                    key={name}
                    className="LoadTable-th LoadTable-sortable"
                    onClick={() => onSort(name)}
                  >
                     <div className="LoadTable-header-content">
                      mean
                      <SortIndicator active={sortConfig.key === name} dir={sortConfig.dir} />
                    </div>
                  </th>
                );
              }
              return (
                <Fragment key={name}>
                  <th
                    key={`${name}|cpu`}
                    className="LoadTable-th LoadTable-sortable"
                    onClick={() => onSort(`${name}|cpu`)}
                  >
                    <div className="LoadTable-header-content">
                      cpu
                      <SortIndicator active={sortConfig.key === `${name}|cpu`} dir={sortConfig.dir} />
                    </div>
                  </th>
                  <th
                    key={`${name}|memory`}
                    className="LoadTable-th LoadTable-sortable"
                    onClick={() => onSort(`${name}|memory`)}
                  >
                    <div className="LoadTable-header-content">
                      memory
                      <SortIndicator active={sortConfig.key === `${name}|memory`} dir={sortConfig.dir} />
                    </div>
                  </th>
                </Fragment>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const byName = new Map(row.benchmarks.map(b => [b.name, b]));
            return (
              <tr key={row.framework} className="LoadTable-tr">
                <td className="LoadTable-td LoadTable-sticky-col">
                  <div className="LoadTable-name-content">
                    <strong>
                      <Link to={`/framework/${row.framework}`} className="LoadTable-link">
                        {row.framework}
                      </Link>
                    </strong>
                    {row.version && <span className="LoadTable-version">v{row.version}</span>}
                  </div>
                </td>
                {benchmarkNames.map(name => {
                  const bm = byName.get(name);
                  
                  if (name === COMPOSITE_NAME) {
                     const loadBenchNames = benchmarkNames.filter(n => n !== COMPOSITE_NAME);
                     let prodCpu = 1; 
                     let countCpu = 0;
                     let prodMem = 1;
                     let countMem = 0;
                     
                     for (const lb of loadBenchNames) {
                         const b = byName.get(lb);
                         if (b?.normalCpu) {
                             prodCpu *= b.normalCpu;
                             countCpu++;
                         }
                         if (b?.normalMemory) {
                             prodMem *= b.normalMemory;
                             countMem++;
                         }
                     }
                     
                     const aggCpu = countCpu > 0 ? Math.pow(prodCpu, 1/countCpu) : 0;
                     const aggMem = countMem > 0 ? Math.pow(prodMem, 1/countMem) : 0;

                     const compositeVal = (aggCpu && aggMem) 
                      ? Math.sqrt(aggCpu * aggMem) 
                      : 0;
                     
                     return (
                        <td
                          key={name}
                          className="LoadTable-td"
                          style={compositeVal > 0 ? { color: color(compositeVal) } : {}}
                        >
                          {compositeVal > 0 ? compositeVal.toFixed(2) : '—'}
                        </td>
                     );
                  }

                  const cpuColor = cellColor('cpu', bm);
                  const memColor = cellColor('memory', bm);
                  
                  return (
                    <Fragment key={`${row.framework}-${name}`}>
                      <td
                        key={`${row.framework}-${name}-cpu`}
                        className="LoadTable-td"
                        style={cpuColor ? { color: cpuColor } : {}}
                      >
                        {formatCpu(bm?.cpu)}
                        {bm?.normalCpu ? <span className="LoadTable-factor">({bm.normalCpu.toFixed(2)})</span> : ''}
                      </td>
                      <td
                        key={`${row.framework}-${name}-memory`}
                        className="LoadTable-td"
                        style={memColor ? { color: memColor } : {}}
                      >
                        {formatMemMB(bm?.memory)}
                        {bm?.normalMemory ? <span className="LoadTable-factor">({bm.normalMemory.toFixed(2)})</span> : ''}
                      </td>
                    </Fragment>
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
