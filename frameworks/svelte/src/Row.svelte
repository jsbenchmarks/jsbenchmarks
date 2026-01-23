<script>
  import { unitmap } from "../../../common/data";
  import {
    getLengthConversion,
    getPowerConversion,
    getWeightConversion,
    selected,
    unitSystem
  } from "./state.svelte";
  const { row, remove } = $props();
</script>

<tr
  class:selected={selected.value === row.id}
  onclick={() => (selected.value = row.id)}
>
  <td>{row.id}</td>
  <td>{row.name}</td>
  <td
    >{(row.weight * getWeightConversion()).toFixed(1)}
    {unitmap.weight[unitSystem.value]}</td
  >
  <td>
    {(row.dimensions.height * getLengthConversion()).toFixed(1)} x
    {(row.dimensions.width * getLengthConversion()).toFixed(1)} x
    {(row.dimensions.depth * getLengthConversion()).toFixed(1)}
    {unitmap.length[unitSystem.value]}
  </td>
  <td
    >{(row.powerConsumption * getPowerConversion()).toFixed(1)}
    {unitmap.power[unitSystem.value]}</td
  >
  <td>${row.price.toFixed(2)}</td>
  <td>{row.availabilityStatus}</td>
  <td>{row.rating.toFixed(1)}</td>
  <td>
    <button
      class="small"
      onclick={(e) => {
        e.stopPropagation();
        remove(row);
      }}
    >
      delete
    </button>
  </td>
</tr>
