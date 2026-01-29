<template>
  <tr :class="{ selected: selected === row.id }" @click="$emit('select', row.id)">
    <td>{{ row.id }}</td>
    <td>{{ row.name }}</td>
    <td>{{ (row.weight * weightConversion).toFixed(1) }} {{ unitmap.weight[unitSystem] }}</td>
    <td>
      {{ (row.dimensions.height * lengthConversion).toFixed(1) }} x
      {{ (row.dimensions.width * lengthConversion).toFixed(1) }} x
      {{ (row.dimensions.depth * lengthConversion).toFixed(1) }}
      {{ unitmap.length[unitSystem] }}
    </td>
    <td>{{ (row.powerConsumption * powerConversion).toFixed(1) }} {{ unitmap.power[unitSystem] }}</td>
    <td>${{ row.price.toFixed(2) }}</td>
    <td>{{ row.availabilityStatus }}</td>
    <td>{{ row.rating.toFixed(1) }}</td>
    <td>
      <button class="small" :disabled="isStreaming" @click.stop="$emit('delete', row.id)">delete</button>
    </td>
  </tr>
</template>

<script setup>
import { unitmap } from 'common/data';

defineProps({
  row: Object,
  selected: Number,
  isStreaming: Boolean,
  unitSystem: String,
  weightConversion: Number,
  lengthConversion: Number,
  powerConversion: Number
})

defineEmits(['select', 'delete'])
</script>
