const productAdjectives = [
  "Smart", "Ergonomic", "Portable", "Durable", "Sleek", "Eco", "Advanced", "Compact", "Efficient", "Wireless"
];

const productNouns = [
  "Watch", "Chair", "Speaker", "Monitor", "Drone", "Phone", "Camera", "TV", "Router", "Lamp"
];

let rand = arr => arr[Math.floor(Math.random() * arr.length)];
let id = 0;

/**
 * Builds an array of mock product specification items.
 * @param {number} count The number of items to generate.
 * @returns {Array<Object>} An array of product objects.
 */
export function buildData(count) {
  const items = new Array(count);
  for (let i = 0; i < count; i++) {
    const widthCm = Math.random() * 50 + 5;
    const heightCm = Math.random() * 80 + 10;
    const depthCm = Math.random() * 30 + 3;
    items[i] = {
      id: id++,
      name: `${rand(productAdjectives)} ${rand(productNouns)} ${Math.floor(Math.random() * 900) + 100}`,
      weight: Math.random() * 20 + 0.1,
      dimensions: {
        width: widthCm,
        height: heightCm,
        depth: depthCm
      },
      powerConsumption: Math.random() * 1000 + 5,
      price: Math.random() * 1000 + 50,
      availabilityStatus: rand(["In Stock", "Low Stock", "Out of Stock"]),
      rating: Math.random() * 2 + 3,
    };
  }
  return items;
}

export const unitmap = {
  weight: { imperial: "lbs", metric: "kg" },
  power: { imperial: "hp", metric: "w" },
  length: { imperial: "in", metric: "cm" },
};

