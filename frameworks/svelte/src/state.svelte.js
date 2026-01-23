
export const rows = $state({ value: [] });
export const selected = $state({ value: null });
export const unitSystem = $state({ value: "metric" });
const _weightConversion = $derived.by(() =>
  unitSystem.value === "metric" ? 1 : 2.20462
);
const _powerConversion = $derived.by(() =>
  unitSystem.value === "metric" ? 1 : 0.00134102
);
const _lengthConversion = $derived.by(() =>
  unitSystem.value === "metric" ? 1 : 0.393701
);

// Export functions to access the derived values
export function getWeightConversion() {
  return _weightConversion;
}

export function getPowerConversion() {
  return _powerConversion;
}

export function getLengthConversion() {
  return _lengthConversion;
}