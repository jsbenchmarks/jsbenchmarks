/** @jsxImportSource preact */
import { computed, signal } from '@preact/signals';
import { buildData } from 'common/data';
import { streamUpdates } from 'common/streaming';
import { Row } from './row.jsx';

export const rows = signal([]);
export const selected = signal(null);
export const unitSystem = signal('metric');
export const isStreaming = signal(false);

let stopStreaming = null;

export const weightConversion = computed(() =>
  unitSystem.value === 'metric' ? 1 : 2.20462
);
export const powerConversion = computed(() =>
  unitSystem.value === 'metric' ? 1 : 0.00134102
);
export const lengthConversion = computed(() =>
  unitSystem.value === 'metric' ? 1 : 0.393701
);

export function App() {
  const create = () => {
    if (stopStreaming) {
      stopStreaming();
      stopStreaming = null;
      isStreaming.value = false;
    }
    rows.value = buildData(1000);
  };

  const stream = () => {
    if (stopStreaming) {
      stopStreaming();
      stopStreaming = null;
      isStreaming.value = false;
      return;
    }
    const initialRows = buildData(25);
    isStreaming.value = true;
    rows.value = initialRows;

    const idMap = new Map();
    for (let i = 0; i < initialRows.length; i++) {
      idMap.set(initialRows[i].id, i);
    }

    stopStreaming = streamUpdates((updates) => {
      const newRows = [...rows.value];
      for (const update of updates) {
        const idx = idMap.get(update.id);
        if (idx !== undefined) {
          const row = newRows[idx];
          newRows[idx] = { 
            ...row, 
            price: update.price || row.price,
            availabilityStatus: update.availabilityStatus || row.availabilityStatus
          };
        }
      }
      rows.value = newRows;
    });
  };

  const clear = () => {
    if (stopStreaming) {
      stopStreaming();
      stopStreaming = null;
      isStreaming.value = false;
    }
    rows.value = [];
  };

  return (
    <main>
      <div class="header">
        <h1>Preact</h1>
        <div class="actions">
          <button id="create" disabled={isStreaming.value} onClick={create}>Create</button>
          <button id="stream" onClick={stream}>{isStreaming.value ? 'Stop' : 'Stream'}</button>
          <button id="reverse" disabled={isStreaming.value} onClick={() => (rows.value = [...rows.value].toReversed())}>Reverse</button>
          <button
            id="insert"
            disabled={isStreaming.value}
            onClick={() =>
              (rows.value = [
                ...rows.value.slice(0, 10),
                ...buildData(1),
                ...rows.value.slice(10),
              ])
            }
          >
            Insert
          </button>
          <button id="prepend" disabled={isStreaming.value} onClick={() => (rows.value = [...buildData(1), ...rows.value])}>Prepend</button>
          <button id="append" disabled={isStreaming.value} onClick={() => (rows.value = [...rows.value, ...buildData(1)])}>Append</button>
          <button
            id="sort"
            disabled={isStreaming.value}
            onClick={() =>
              (rows.value = [...rows.value].toSorted((a, b) =>
                a.name.localeCompare(b.name)
              ))
            }
          >
            Sort
          </button>
          <button
            id="filter"
            disabled={isStreaming.value}
            onClick={() =>
              (rows.value = rows.value.filter((d) => d.id % 2))
            }
          >
            Filter
          </button>
          <button
            id="units"
            disabled={isStreaming.value}
            onClick={() =>
              (unitSystem.value = unitSystem.value === 'imperial' ? 'metric' : 'imperial')
            }
          >
            Units
          </button>
          <button
            id="restock"
            disabled={isStreaming.value}
            onClick={() =>
              (rows.value = rows.value.map(r => r.availabilityStatus === "Out of Stock" ? { ...r, availabilityStatus: "In Stock" } : r))
            }
          >
            Restock
          </button>
          <button id="clear" disabled={isStreaming.value} onClick={clear}>Clear</button>
        </div>
      </div>

      {rows.value.length ? (
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
            {rows.value.map((row) => (
              <Row key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      ) : (
        <h2 class="text-center">No rows to show</h2>
      )}
    </main>
  );
}
