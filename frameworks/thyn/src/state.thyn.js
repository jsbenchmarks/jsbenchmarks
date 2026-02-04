import { unitmap } from "common/data.js";

const { weight, length, power } = unitmap;

export const data = $signal([]);
export const selected = $signal(null);
export const unitSystem = $signal("metric");
export const stopStreaming = $signal(null);

export const weightConversion = () => unitSystem() === "metric" ? 1 : 2.20462;
export const powerConversion = () => unitSystem() === "metric" ? 1 : 0.00134102;
export const lengthConversion = () => unitSystem() === "metric" ? 1 : 0.393701;

export const weightUnits = () => weight[unitSystem()];
export const lengthUnits = () => length[unitSystem()];
export const powerUnits = () => power[unitSystem()];
