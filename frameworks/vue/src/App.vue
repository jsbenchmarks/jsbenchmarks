<template>
  <main>
    <div class="header">
      <h1>Vue</h1>
      <div class="actions">
        <button id="create" @click="create">Create</button>
        <button id="stream" @click="stream">{{ isStreaming ? 'Stop' : 'Stream' }}</button>
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
        <button id="clear" @click="clear">Clear</button>
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
import { streamUpdates } from 'common/streaming'
import { computed, ref, shallowRef } from 'vue'
import Row from './Row.vue'

const rows = shallowRef([])
const selected = ref(null)
const unitSystem = ref("metric")
const isStreaming = ref(false)
let stopStreaming = null

const weightConversion = computed(() =>
  unitSystem.value === "metric" ? 1 : 2.20462
)
const powerConversion = computed(() =>
  unitSystem.value === "metric" ? 1 : 0.00134102
)
const lengthConversion = computed(() =>
  unitSystem.value === "metric" ? 1 : 0.393701
)

function create() {
  if (stopStreaming) {
    stopStreaming();
    stopStreaming = null;
    isStreaming.value = false;
  }
  rows.value = buildData(1000)
}

function stream() {
  if (stopStreaming) {
    stopStreaming();
    stopStreaming = null;
    isStreaming.value = false;
    return;
  }
  isStreaming.value = true;
  rows.value = buildData(25);
  stopStreaming = streamUpdates((updates) => {
    const newRows = [...rows.value];
    const idMap = new Map();
    for (let i = 0; i < newRows.length; i++) {
      idMap.set(newRows[i].id, i);
    }
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
}

function clear() {
  if (stopStreaming) {
    stopStreaming();
    stopStreaming = null;
    isStreaming.value = false;
  }
  rows.value = []
}
</script>
