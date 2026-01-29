import { currentId, randomAvailability } from './data';

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
            update.availabilityStatus = randomAvailability();
        } else {
            update.price = Math.random() * 1000 + 50;
            update.availabilityStatus = randomAvailability();
        }
        
        updates.push(update);
    }
    callback(updates);
    updates.length = 0;
  }
  intervalId = setInterval(emit, 10);
  return () => clearInterval(intervalId);
}
