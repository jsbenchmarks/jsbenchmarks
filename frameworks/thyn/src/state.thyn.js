export const data = $signal([]);
export const selected = $signal(null);
export const unitSystem = $signal("metric");

export const weightConversion = () => unitSystem() === "metric" ? 1 : 2.20462;
export const powerConversion = () => unitSystem() === "metric" ? 1 : 0.00134102;
export const lengthConversion = () => unitSystem() === "metric" ? 1 : 0.393701;
