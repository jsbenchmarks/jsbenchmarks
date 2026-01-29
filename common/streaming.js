import { currentId } from './data';

export function streamUpdates(callback) {
  let intervalId;
  const updates = [];
  function emit() {
    for (let i = 0; i < 10; i++) {
        const id = Math.floor(Math.random() * 25) + currentId - 25;
        const update = { id };
        const type = Math.random();
        if (type < 0.33) {
            update.price = Math.random() * 1000 + 50;
        } else if (type < 0.66) {
            update.availabilityStatus = Math.random() > 0.5 ? "In Stock" : "Out of Stock";
        } else {
            update.price = Math.random() * 1000 + 50;
            update.availabilityStatus = Math.random() > 0.5 ? "In Stock" : "Out of Stock";
        }
        
        updates.push(update);
    }
    callback(updates);
    updates.length = 0;
  }
  intervalId = setInterval(emit, 10);
  return () => clearInterval(intervalId);
}
