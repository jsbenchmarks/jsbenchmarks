import { buildData } from 'common/data';
import { useMemo, useState } from 'react';
import Row from './Row';

export default function App() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [unitSystem, setUnitSystem] = useState('metric');

  const weightConversion = useMemo(
    () => (unitSystem === 'metric' ? 1 : 2.20462),
    [unitSystem]
  );

  const powerConversion = useMemo(
    () => (unitSystem === 'metric' ? 1 : 0.00134102),
    [unitSystem]
  );

  const lengthConversion = useMemo(
    () => (unitSystem === 'metric' ? 1 : 0.393701),
    [unitSystem]
  );

  return (
    <main>
      <div className="header">
        <h1>React</h1>
        <div className="actions">
          <button id="create" onClick={() => setRows(buildData(1000))}>Create</button>
          <button id="reverse" onClick={() => setRows([...rows].toReversed())}>Reverse</button>
          <button id="splice" onClick={() =>
            setRows([...rows.slice(0, 10), ...buildData(1), ...rows.slice(10)])
          }>
            Splice
          </button>
          <button id="prepend" onClick={() => setRows([...buildData(1), ...rows])}>
            Prepend
          </button>
          <button id="append" onClick={() => setRows([...rows, ...buildData(1)])}>
            Append
          </button>
          <button id="sort" onClick={() =>
            setRows([...rows].toSorted((a, b) => a.name.localeCompare(b.name)))
          }>
            Sort
          </button>
          <button id="filter" onClick={() => setRows(rows.filter((d) => d.id % 2))}>
            Filter
          </button>
          <button id="units" onClick={() =>
            setUnitSystem(unitSystem === 'imperial' ? 'metric' : 'imperial')
          }>
            Units
          </button>
          <button id="restock" onClick={() =>
            setRows(rows => rows.map(r => r.availabilityStatus === "Out of Stock" ? { ...r, availabilityStatus: "In Stock" } : r))
          }>
            Restock
          </button>
          <button id="clear" onClick={() => setRows([])}>Clear</button>
        </div>
      </div>

      {rows.length ? (
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>name</th>
              <th>weight</th>
              <th>dimensions</th>
              <th>power consumption</th>
              <th>price</th>
              <th>availability status</th>
              <th>rating</th>
              <th>actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row
                key={row.id}
                row={row}
                selected={selected}
                setSelected={setSelected}
                setRows={setRows}
                rows={rows}
                unitSystem={unitSystem}
                weightConversion={weightConversion}
                lengthConversion={lengthConversion}
                powerConversion={powerConversion}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <h2 className="text-center">No rows to show</h2>
      )}
    </main>
  );
}
