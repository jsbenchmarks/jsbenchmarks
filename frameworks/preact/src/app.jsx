/** @jsxImportSource preact */
import { computed, signal } from '@preact/signals';
import { buildData } from 'common/data';
import { Row } from './row.jsx';

export const rows = signal([]);
export const selected = signal(null);
export const unitSystem = signal('metric');

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
  return (
    <main>
      <div class="header">
        <h1>Preact</h1>
        <div class="actions">
          <button id="create" onClick={() => (rows.value = buildData(1000))}>Create</button>
          <button id="reverse" onClick={() => (rows.value = [...rows.value].toReversed())}>Reverse</button>
          <button
            id="splice"
            onClick={() =>
              (rows.value = [
                ...rows.value.slice(0, 10),
                ...buildData(1),
                ...rows.value.slice(10),
              ])
            }
          >
            Splice
          </button>
          <button id="prepend" onClick={() => (rows.value = [...buildData(1), ...rows.value])}>Prepend</button>
          <button id="append" onClick={() => (rows.value = [...rows.value, ...buildData(1)])}>Append</button>
          <button
            id="sort"
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
            onClick={() =>
              (rows.value = rows.value.filter((d) => d.id % 2))
            }
          >
            Filter
          </button>
          <button
            id="units"
            onClick={() =>
              (unitSystem.value = unitSystem.value === 'imperial' ? 'metric' : 'imperial')
            }
          >
            Units
          </button>
          <button
            id="restock"
            onClick={() =>
              (rows.value = rows.value.map(r => r.availabilityStatus === "Out of Stock" ? { ...r, availabilityStatus: "In Stock" } : r))
            }
          >
            Restock
          </button>
          <button id="clear" onClick={() => (rows.value = [])}>Clear</button>
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
