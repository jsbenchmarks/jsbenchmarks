import { buildData } from 'common/data';
import { streamUpdates } from 'common/streaming';
import { useMemo, useRef, useState } from 'react';
import Row from './Row';

export default function App() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [unitSystem, setUnitSystem] = useState('metric');
  const [isStreaming, setIsStreaming] = useState(false);
  const stopStreaming = useRef(null);

  const create = () => {
    if (stopStreaming.current) {
      stopStreaming.current();
      stopStreaming.current = null;
      setIsStreaming(false);
    }
    setRows(buildData(1000));
  };

  const stream = () => {
    if (stopStreaming.current) {
      stopStreaming.current();
      stopStreaming.current = null;
      setIsStreaming(false);
      return;
    }
    const initialRows = buildData(25);
    setIsStreaming(true);
    setRows(initialRows);

    const idMap = new Map();
    for (let i = 0; i < initialRows.length; i++) {
      idMap.set(initialRows[i].id, i);
    }

    stopStreaming.current = streamUpdates((update) => {
      setRows(currentRows => {
        const newRows = [...currentRows];
        const idx = idMap.get(update.id);
        if (idx !== undefined) {
          const row = newRows[idx];
          newRows[idx] = { 
            ...row, 
            price: update.price || row.price,
            availabilityStatus: update.availabilityStatus || row.availabilityStatus
          };
        }
        return newRows;
      });
    });
  };

  const clear = () => {
    if (stopStreaming.current) {
      stopStreaming.current();
      stopStreaming.current = null;
      setIsStreaming(false);
    }
    setRows([]);
  };

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
          <button id="create" disabled={isStreaming} onClick={create}>Create</button>
          <button id="stream" onClick={stream}>{isStreaming ? 'Stop' : 'Stream'}</button>
          <button id="reverse" disabled={isStreaming} onClick={() => setRows([...rows].toReversed())}>Reverse</button>
          <button id="insert" disabled={isStreaming} onClick={() =>
            setRows([...rows.slice(0, 10), ...buildData(1), ...rows.slice(10)])
          }>
            Insert
          </button>
          <button id="prepend" disabled={isStreaming} onClick={() => setRows([...buildData(1), ...rows])}>
            Prepend
          </button>
          <button id="append" disabled={isStreaming} onClick={() => setRows([...rows, ...buildData(1)])}>
            Append
          </button>
          <button id="sort" disabled={isStreaming} onClick={() =>
            setRows([...rows].toSorted((a, b) => a.name.localeCompare(b.name)))
          }>
            Sort
          </button>
          <button id="filter" disabled={isStreaming} onClick={() => setRows(rows.filter((d) => d.id % 2))}>
            Filter
          </button>
          <button id="units" disabled={isStreaming} onClick={() =>
            setUnitSystem(unitSystem === 'imperial' ? 'metric' : 'imperial')
          }>
            Units
          </button>
          <button id="restock" disabled={isStreaming} onClick={() =>
            setRows(rows => rows.map(r => r.availabilityStatus === "Out of Stock" ? { ...r, availabilityStatus: "In Stock" } : r))
          }>
            Restock
          </button>
          <button id="clear" disabled={isStreaming} onClick={clear}>Clear</button>
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
                isStreaming={isStreaming}
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
