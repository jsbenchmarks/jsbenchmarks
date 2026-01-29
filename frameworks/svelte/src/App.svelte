<script>
  import { buildData } from "../../../common/data";
  import { streamUpdates } from "../../../common/streaming";
  import Row from "./Row.svelte";

  import { unitSystem } from "./state.svelte";

  let rows = $state.raw([]);
  let isStreaming = $state(false);
  let stopStreaming = null;

  function create() {
    if (stopStreaming) {
      stopStreaming();
      stopStreaming = null;
      isStreaming = false;
    }
    rows = buildData(1000);
  }

  function stream() {
    if (stopStreaming) {
      stopStreaming();
      stopStreaming = null;
      isStreaming = false;
      return;
    }
    const initialRows = buildData(25);
    isStreaming = true;
    rows = initialRows;

    const idMap = new Map();
    for (let i = 0; i < initialRows.length; i++) {
      idMap.set(initialRows[i].id, i);
    }

    stopStreaming = streamUpdates((updates) => {
      const newRows = [...rows];
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
      rows = newRows;
    });
  }

  function clear() {
    if (stopStreaming) {
      stopStreaming();
      stopStreaming = null;
      isStreaming = false;
    }
    rows = [];
  }

  function remove(row) {
    rows = rows.filter((r) => r !== row);
  }
</script>

<main>
  <div class="header">
    <h1>Svelte</h1>
    <div class="actions">
      <button id="create" disabled={isStreaming} onclick={create}
        >Create</button
      >
      <button id="stream" onclick={stream}
        >{isStreaming ? 'Stop' : 'Stream'}</button
      >
      <button id="reverse" disabled={isStreaming} onclick={() => (rows = rows.toReversed())}>Reverse</button>
      <button
        id="insert"
        disabled={isStreaming}
        onclick={() =>
          (rows = [...rows.slice(0, 10), ...buildData(1), ...rows.slice(10)])}
        >Insert</button
      >
      <button id="prepend" disabled={isStreaming} onclick={() => (rows = [...buildData(1), ...rows])}
        >Prepend</button
      >
      <button id="append" disabled={isStreaming} onclick={() => (rows = [...rows, ...buildData(1)])}
        >Append</button
      >
      <button
        id="sort"
        disabled={isStreaming}
        onclick={() =>
          (rows = rows.toSorted((a, b) => a.name.localeCompare(b.name)))}
        >Sort</button
      >
      <button id="filter" disabled={isStreaming} onclick={() => (rows = rows.filter((d) => d.id % 2))}
        >Filter</button
      >
      <button
        id="units"
        disabled={isStreaming}
        onclick={() =>
          (unitSystem.value =
            unitSystem.value === 'imperial' ? 'metric' : 'imperial')}
        >Units</button
      >
      <button
        id="restock"
        disabled={isStreaming}
        onclick={() =>
          (rows = rows.map((r) =>
            r.availabilityStatus === 'Out of Stock'
              ? { ...r, availabilityStatus: 'In Stock' }
              : r
          ))}>Restock</button
      >
      <button id="clear" disabled={isStreaming} onclick={clear}>Clear</button>
    </div>
  </div>

  {#if rows.length}
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
        {#each rows as row (row.id)}
          <Row {row} {remove} {isStreaming} />
        {/each}
      </tbody>
    </table>
  {:else}
    <h2 class="text-center">No rows to show</h2>
  {/if}
</main>
