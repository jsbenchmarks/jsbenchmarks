import { buildData as buildRawData } from 'common/data';
import { createSelector, createSignal, For, Show } from 'solid-js';
import Row from './Row';

function buildData(cnt) {
    return buildRawData(cnt).map(row => ({
        ...row,
        availabilityStatus: createSignal(row.availabilityStatus),
        price: createSignal(row.price),
    }));
}

export const [rows, setRows] = createSignal([]);
export const [selected, setSelected] = createSignal(null);
export const [unitSystem, setUnitSystem] = createSignal('metric');

export const weightConversion = () => unitSystem() === 'metric' ? 1 : 2.20462;
export const powerConversion = () => unitSystem() === 'metric' ? 1 : 0.00134102;
export const lengthConversion = () => unitSystem() === 'metric' ? 1 : 0.393701;

export const isSelected = createSelector(selected);

function App() {
  return (
    <main>
      <div class="header">
        <h1>Solid</h1>
        <div class="actions">
          <button id="create" onClick={() => setRows(buildData(1000))}>Create</button>
          <button id="reverse" onClick={() => setRows([...rows()].toReversed())}>Reverse</button>
          <button id="insert" onClick={() => setRows([
            ...rows().slice(0, 10),
            ...buildData(1),
            ...rows().slice(10),
          ])}>Insert</button>
          <button id="prepend" onClick={() => setRows([...buildData(1), ...rows()])}>Prepend</button>
          <button id="append" onClick={() => setRows([...rows(), ...buildData(1)])}>Append</button>
          <button id="sort" onClick={() => setRows([...rows()].toSorted((a, b) => a.name.localeCompare(b.name)))}>Sort</button>
          <button id="filter" onClick={() => setRows(rows().filter((d) => d.id % 2))}>Filter</button>
          <button id="units" onClick={() => setUnitSystem(unitSystem() === 'imperial' ? 'metric' : 'imperial')}>Units</button>
          <button id="restock" onClick={() => rows().forEach(r => r.availabilityStatus[0]() === "Out of Stock" ? r.availabilityStatus[1]("In Stock") : null)}>Restock</button>
          <button id="clear" onClick={() => setRows([])}>Clear</button>
        </div>
      </div>

      <Show when={rows().length} fallback={<h2 class="text-center">No rows to show</h2>}>
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
            <For each={rows()}>
              {(row) => (
                <Row
                  row={row}
                />
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </main>
  );
}

export default App;
