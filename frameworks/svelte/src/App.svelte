<script>
  import { buildData } from "../../../common/data";
  import Row from "./Row.svelte";

  import { unitSystem } from "./state.svelte";

  let rows = $state.raw([]);

  function remove(row) {
    rows = rows.filter((r) => r !== row);
  }
</script>

<main>
  <div class="header">
    <h1>Svelte</h1>
    <div class="actions">
      <button id="create" onclick={() => (rows = buildData(1000))}
        >Create</button
      >
      <button id="reverse" onclick={() => (rows = rows.toReversed())}>Reverse</button>
      <button
        id="insert"
        onclick={() =>
          (rows = [...rows.slice(0, 10), ...buildData(1), ...rows.slice(10)])}
        >Insert</button
      >
      <button id="prepend" onclick={() => (rows = [...buildData(1), ...rows])}
        >Prepend</button
      >
      <button id="append" onclick={() => (rows = [...rows, ...buildData(1)])}
        >Append</button
      >
      <button
        id="sort"
        onclick={() =>
          (rows = rows.toSorted((a, b) => a.name.localeCompare(b.name)))}
        >Sort</button
      >
      <button id="filter" onclick={() => (rows = rows.filter((d) => d.id % 2))}
        >Filter</button
      >
      <button
        id="units"
        onclick={() =>
          (unitSystem.value =
            unitSystem.value === 'imperial' ? 'metric' : 'imperial')}
        >Units</button
      >
      <button
        id="restock"
        onclick={() =>
          (rows = rows.map((r) =>
            r.availabilityStatus === 'Out of Stock'
              ? { ...r, availabilityStatus: 'In Stock' }
              : r
          ))}>Restock</button
      >
      <button id="clear" onclick={() => (rows = [])}>Clear</button>
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
          <Row {row} {remove} />
        {/each}
      </tbody>
    </table>
  {:else}
    <h2 class="text-center">No rows to show</h2>
  {/if}
</main>
