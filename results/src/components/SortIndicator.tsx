import type { SortDirection } from '../types';
import './SortIndicator.css';

interface SortIndicatorProps {
  active: boolean;
  dir: SortDirection;
}

export const SortIndicator = ({ active, dir }: SortIndicatorProps) => {
  if (!active) return <span className="SortIndicator-icon SortIndicator-inactive">↕</span>;
  return <span className="SortIndicator-icon SortIndicator-active">{dir === 'asc' ? '▲' : '▼'}</span>;
};
