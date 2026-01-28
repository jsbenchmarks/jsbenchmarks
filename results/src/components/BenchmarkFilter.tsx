import './BenchmarkFilter.css';

interface BenchmarkFilterProps {
  benchmarks: string[];
  selected: Set<string>;
  onChange: (name: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

export const BenchmarkFilter = ({ benchmarks, selected, onChange, onSelectAll, onSelectNone }: BenchmarkFilterProps) => {
  return (
    <div className="BenchmarkFilter-container">
      <div className="BenchmarkFilter-title">
        Filter Benchmarks 
        <button className="BenchmarkFilter-button" onClick={onSelectAll}>All</button>
        /
        <button className="BenchmarkFilter-button" onClick={onSelectNone}>None</button>
      </div>
      {benchmarks.map(name => (
        <label key={name} className="BenchmarkFilter-label">
          <input
            type="checkbox"
            checked={selected.has(name)}
            onChange={() => onChange(name)}
          />
          {name}
        </label>
      ))}
    </div>
  );
};
