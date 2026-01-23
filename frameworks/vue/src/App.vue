<template>
  <main>
    <div class="header">
      <h1>Vue</h1>
      <div class="actions">
        <button id="create" @click="() => rows = buildData(1000)">Create</button>
        <button id="reverse" @click="() => rows = rows.toReversed()">Reverse</button>
        <button id="insert"
          @click="() => rows = [...rows.slice(0, 10), ...buildData(1), ...rows.slice(10)]">Insert</button>
        <button id="prepend" @click="() => rows = [...buildData(1), ...rows]">Prepend</button>
        <button id="append" @click="() => rows = [...rows, ...buildData(1)]">Append</button>
        <button id="sort" @click="() => rows = rows.toSorted((a, b) => a.name.localeCompare(b.name))">Sort</button>
        <button id="filter" @click="() => rows = rows.filter(d => d.id % 2)">Filter</button>
        <button id="units" @click="() => unitSystem = unitSystem === 'imperial' ? 'metric' : 'imperial'">Units</button>
        <button id="restock" @click="() => rows = rows.map(r => r.availabilityStatus === 'Out of Stock'
          ? { ...r, availabilityStatus: 'In Stock' }
          : r)">Restock</button>
        <button id="clear" @click="() => rows = []">Clear</button>
      </div>
    </div>

    <table v-if="rows.length">
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
        <Row v-for="row in rows" :key="row.id" :row="row" :selected="selected" :unitSystem="unitSystem"
          :weightConversion="weightConversion" :lengthConversion="lengthConversion" :powerConversion="powerConversion"
          @select="selected = $event" @delete="rows = rows.filter(r => r.id !== row.id)" />
      </tbody>
    </table>

    <h2 v-else class="text-center">No rows to show</h2>
  </main>
</template>

<script setup>
import { buildData } from 'common/data'
import { computed, ref } from 'vue'
import Row from './Row.vue'

const rows = ref([])
const selected = ref(null)
const unitSystem = ref("metric")

const weightConversion = computed(() =>
  unitSystem.value === "metric" ? 1 : 2.20462
)
const powerConversion = computed(() =>
  unitSystem.value === "metric" ? 1 : 0.00134102
)
const lengthConversion = computed(() =>
  unitSystem.value === "metric" ? 1 : 0.393701
)
</script>
