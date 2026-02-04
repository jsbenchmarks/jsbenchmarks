export const benchmarks = [
  {
    runs: 16,
    name: "create",
    setup: [],
    warmup: [
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
      {
        click: "#clear",
        done: () => document.querySelectorAll("tbody tr").length === 0,
      },
    ],
    measure: {
      click: "#create",
      done: j => document.querySelectorAll("tbody tr").length === 1000,
    },
  },
  {
    runs: 16,
    name: "replace",
    setup: [
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    warmup: [
      {
        click: "#create",
        done: i => document.querySelector("tbody tr td").textContent === `${(i+1) * 1000}`,
      },
    ],
    measure: {
      click: "#create",
      done: j => { console.log(j); return document.querySelector("tbody tr td").textContent === `${(j + 2) * 1000}` && document.querySelectorAll("tbody tr").length === 1000 },
    },
  },
  {
    runs: 16,
    name: "reverse",
    setup: [
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    warmup: [
      {
        click: "#reverse",
        done: i => {
          const tds = Array.from(document.querySelectorAll("td:first-child"));
          // Warmup toggles state: Even i = Descending, Odd i = Ascending
          if (i % 2 === 0) {
            for (let j = 0; j < 1000; j++) {
              const expected = 999 - j;
              const actual = parseInt(tds[j].textContent, 10);
              if (actual !== expected) return false;
            }
            return true;
          }
          for (let j = 0; j < 1000; j++) {
            const expected = j;
            const actual = parseInt(tds[j].textContent, 10);
            if (actual !== expected) return false;
          }
          return true;
        },
      },
    ],
    measure: {
      click: "#reverse",
      // Fix: Measure ALWAYS happens after a fresh Create. 
      // So checking #reverse means the result is ALWAYS Descending.
      // IDs are from the second batch (Setup 1 -> Clear -> Setup 2).
      // Batch 1: 0-999. Batch 2: 1000-1999. 
      // Reversed Batch 2: 1999 down to 1000.
      done: () => {
        const tds = document.querySelectorAll("td:first-child");
        for (let k = 0; k < 1000; k++) {
          const expected = 1999 - k;
          const actual = parseInt(tds[k].textContent, 10);
          if (actual !== expected) {
            // console.log({ expected, actual });
            return false;
          }
        }
        return true;
      },
    },
  },
  {
    runs: 16,
    name: "sort",
    setup: [
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    warmup: [
      {
        click: "#sort",
        done: () => {
          const names = Array.from(document.querySelectorAll("tr td:nth-of-type(2)")).map(td => td.textContent);
          return names.every((name, i) => {
            if (i === names.length - 1) {
              return true;
            }
            return name.localeCompare(names[i + 1]) <= 0;
          });
        },
      },
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    measure: {
      click: "#sort",
      done: j => {
        const names = Array.from(document.querySelectorAll("tr td:nth-of-type(2)")).map(td => td.textContent);
        return names.every((name, i) => {
          if (i === names.length - 1) {
            return true;
          }
          return name.localeCompare(names[i + 1]) <= 0;
        });
      },
    },
  },
  {
    runs: 16,
    name: "clear",
    setup: [
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    warmup: [
      {
        click: "#clear",
        done: () => document.querySelectorAll("tbody tr").length === 0,
      },
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    measure: {
      click: "#clear",
      done: j => document.querySelectorAll("tbody tr").length === 0,
    },
  },
  {
    runs: 16,
    name: "filter",
    setup: [
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    warmup: [
      {
        click: "#filter",
        done: () => document.querySelectorAll("tbody tr").length === 500,
      },
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    measure: {
      click: "#filter",
      done: j => document.querySelectorAll("tbody tr").length === 500,
    },
  },
  {
    runs: 16,
    name: "delete",
    setup: [
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    warmup: [
      {
        click: "tbody tr:nth-of-type(1) button:nth-of-type(1)",
        done: i => document.querySelectorAll("tbody tr").length === 999 - i,
      },
    ],
    measure: {
      click: "tbody tr:nth-of-type(1) button:nth-of-type(1)",
      done: j => document.querySelectorAll("tbody tr").length === 999,
    },
  },
  {
    runs: 16,
    name: "insert",
    setup: [
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    warmup: [
      {
        click: "#insert",
        done: i => document.querySelectorAll("tbody tr").length === 1001 + i,
      },
    ],
    measure: {
      click: "#insert",
      done: () => document.querySelectorAll("tbody tr").length === 1001,
    },
  },
  {
    runs: 16,
    name: "prepend",
    setup: [
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    warmup: [
      {
        click: "#prepend",
        done: i => document.querySelectorAll("tbody tr").length === 1001 + i,
      },
    ],
    measure: {
      click: "#prepend",
      done: j => document.querySelectorAll("tbody tr").length === 1001,
    },
  },
  {
    runs: 16,
    name: "append",
    setup: [
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    warmup: [
      {
        click: "#append",
        done: i => document.querySelectorAll("tbody tr").length === 1001 + i,
      },
    ],
    measure: {
      click: "#append",
      done: j => document.querySelectorAll("tbody tr").length === 1001,
    },
  },
  {
    runs: 16,
    name: "select",
    setup: [
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    warmup: [
      {
        click: "tbody tr:nth-of-type(__nth__)",
        done: "tbody tr:nth-of-type(__nth__).selected",
      },
    ],
    measure: {
      click: "tbody tr:nth-of-type(10)",
      done: j => document.querySelector("tbody tr:nth-of-type(10)").classList.contains("selected"),
    },
  },
  {
    runs: 16,
    name: "units",
    setup: [
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    warmup: [
      {
        click: "#units",
        done: i => document.querySelector("tbody tr td:nth-of-type(3)").innerText.includes(i % 2 === 0 ? "lbs" : "kg"),
      },
    ],
    measure: {
      click: "#units",
      done: j => document.querySelector("tbody tr td:nth-of-type(3)").innerText.includes(j % 2 === 0 ? "lbs" : "kg"),
    },
  },
  {
    runs: 16,
    name: "restock",
    setup: [
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    warmup: [
      {
        click: "#restock",
        done: () => {
          const cells = Array.from(document.querySelectorAll("tbody tr td:nth-of-type(7)"));
          return cells.length > 0 && cells.every(td => td.textContent !== "Out of Stock");
        },
      },
      {
        click: "#create",
        done: () => document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
    measure: {
      click: "#restock",
      done: j => {
        const cells = Array.from(document.querySelectorAll("tbody tr td:nth-of-type(7)"));
        return cells.length > 0 && cells.every(td => td.textContent !== "Out of Stock");
      },
    },
  },
];