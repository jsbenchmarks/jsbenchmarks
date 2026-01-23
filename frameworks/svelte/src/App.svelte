<script>
  import { buildData } from "../../../common/data";
  import Row from "./Row.svelte";

  import { rows, unitSystem } from "./state.svelte";
</script>

<main>
  <div class="header">
    <h1>Svelte</h1>
    <div class="actions">
      <button id="create" onclick={() => (rows.value = buildData(1000))}
        >Create</button
      >
      <button
        id="reverse"
        onclick={() => (rows.value = rows.value.toReversed())}>Reverse</button
      >
      <button
        id="insert"
        onclick={() =>
          (rows.value = [
            ...rows.value.slice(0, 10),
            ...buildData(1),
            ...rows.value.slice(10),
          ])}>Insert</button
      >
      <button
        id="prepend"
        onclick={() => (rows.value = [...buildData(1), ...rows.value])}
        >Prepend</button
      >
      <button
        id="append"
        onclick={() => (rows.value = [...rows.value, ...buildData(1)])}
        >Append</button
      >
      <button
        id="sort"
        onclick={() =>
          (rows.value = rows.value.toSorted((a, b) =>
            a.name.localeCompare(b.name),
          ))}>Sort</button
      >
      <button
        id="filter"
        onclick={() => (rows.value = rows.value.filter((d) => d.id % 2))}
        >Filter</button
      >
      <button
        id="units"
        onclick={() =>
          (unitSystem.value =
            unitSystem.value === "imperial" ? "metric" : "imperial")}
        >Units</button
      >
      <button
        id="restock"
        onclick={() =>
          (rows.value = rows.value.map((r) =>
            r.availabilityStatus === "Out of Stock"
              ? { ...r, availabilityStatus: "In Stock" }
              : r,
          ))}>Restock</button
      >
      <button id="clear" onclick={() => (rows.value = [])}>Clear</button>
    </div>
  </div>

  {#if rows.value.length}
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
        {#each rows.value as row (row.id)}
          <Row {row} />
        {/each}
      </tbody>
    </table>
  {:else}
    <h2 class="text-center">No rows to show</h2>
  {/if}
</main>
