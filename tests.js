export const benchmarks = [
  {
    runs: 16,
    name: "create",
    setup: [],
    warmup: [
      {
        click: "#create",
        done: "table",
      },
      {
        click: "#clear",
        done: "h2",
      },
    ],
    measure: [
      {
        click: "#create",
        done: "table",
      },
    ],
  },
  {
    runs: 16,
    name: "replace",
    setup: [
      {
        click: "#create",
        done: "table",
      },
    ],
    warmup: [
      {
        click: "#create",
        done: i => document.querySelector("tbody tr td").textContent === `${(i+1) * 1000}`,
      },
    ],
    measure: [
      {
        click: "#create",
        done: () => document.querySelector("tbody tr td").textContent === "7000" && document.querySelectorAll("tbody tr").length === 1000,
      },
    ],
  },
  {
    runs: 16,
    name: "reverse",
    setup: [
      {
        click: "#create",
        done: "table",
      },
    ],
    warmup: [
      {
        click: "#reverse",
        done: i => {
          const tds = Array.from(document.querySelectorAll("td:first-child"));
          if (i % 2 === 0) {
            for (let j = 0; j < 1000; j++) {
              const expected = 999 - j;
              const actual = parseInt(tds[j].textContent, 10);
              if (actual !== expected) {
                console.log({ expected, actual });
                return false;
              }
            }
            return true;
          }
          for (let j = 0; j < 1000; j++) {
            const expected = j;
            const actual = parseInt(tds[j].textContent, 10);
            if (actual !== expected) {
                console.log({ expected, actual });
              return false;
            }
          }
          return true;
        },
      },
    ],
    measure: [
      {
        click: "#reverse",
        done: () => {
          const tds = document.querySelectorAll("td:first-child");
          for (let j = 0; j < 1000; j++) {
            const expected = 1999 - j;
            const actual = parseInt(tds[j].textContent, 10);
            if (actual !== expected) {
                console.log({ expected, actual });
              return false;
            }
          }
          return true;
        },
      },
    ],
  },
  {
    runs: 16,
    name: "sort",
    setup: [
      {
        click: "#create",
        done: "table",
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
        done: "table",
      },
    ],
    measure: [
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
    ],
  },
  {
    runs: 16,
    name: "clear",
    setup: [
      {
        click: "#create",
        done: "table",
      },
    ],
    warmup: [
      {
        click: "#clear",
        done: "h2",
      },
      {
        click: "#create",
        done: "table",
      },
    ],
    measure: [
      {
        click: "#clear",
        done: "h2",
      },
    ],
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
        done: "table",
      },
    ],
    measure: [
      {
        click: "#filter",
        done: () => document.querySelectorAll("tbody tr").length === 500,
      },
    ],
  },
  {
    runs: 16,
    name: "delete",
    setup: [
      {
        click: "#create",
        done: "table",
      },
    ],
    warmup: [
      {
        click: "tbody tr:nth-of-type(1) button:nth-of-type(1)",
        done: i => document.querySelectorAll("tbody tr").length === 999 - i,
      },
    ],
    measure: [
      {
        click: "tbody tr:nth-of-type(10) button:nth-of-type(1)",
        done: () => document.querySelectorAll("tbody tr").length === 999,
      },
    ],
  },
  {
    runs: 16,
    name: "splice",
    setup: [
      {
        click: "#create",
        done: "table",
      },
    ],
    warmup: [
      {
        click: "#splice",
        done: i => document.querySelectorAll("tbody tr").length === 1001 + i,
      },
    ],
    measure: [
      {
        click: "#splice",
        done: () => document.querySelectorAll("tbody tr").length === 1001,
      },
    ],
  },
  {
    runs: 16,
    name: "prepend",
    setup: [
      {
        click: "#create",
        done: "table",
      },
    ],
    warmup: [
      {
        click: "#prepend",
        done: i => document.querySelectorAll("tbody tr").length === 1001 + i,
      },
    ],
    measure: [
      {
        click: "#prepend",
        done: () => document.querySelectorAll("tbody tr").length === 1001,
      },
    ],
  },
  {
    runs: 16,
    name: "append",
    setup: [
      {
        click: "#create",
        done: "table",
      },
    ],
    warmup: [
      {
        click: "#append",
        done: i => document.querySelectorAll("tbody tr").length === 1001 + i,
      },
    ],
    measure: [
      {
        click: "#append",
        done: () => document.querySelectorAll("tbody tr").length === 1001,
      },
    ],
  },
  {
    runs: 16,
    name: "select",
    setup: [
      {
        click: "#create",
        done: "table",
      },
    ],
    warmup: [
      {
        click: "tbody tr:nth-of-type(__nth__)",
        done: "tbody tr:nth-of-type(__nth__).selected",
      },
    ],
    measure: [
      {
        click: "tbody tr:nth-of-type(10)",
        done: "tbody tr:nth-of-type(10).selected",
      },
    ],
  },
  {
    runs: 16,
    name: "units",
    setup: [
      {
        click: "#create",
        done: "table",
      },
    ],
    warmup: [
      {
        click: "#units",
        done: i => document.querySelector("tbody tr td:nth-of-type(3)").innerText.includes(i % 2 === 0 ? "lbs" : "kg"),
      },
    ],
    measure: [
      {
        click: "#units",
        done: () => document.querySelector("tbody tr td:nth-of-type(3)").innerText.includes("kg"),
      },
    ],
  },
  {
    runs: 16,
    name: "restock",
    setup: [
      {
        click: "#create",
        done: "table",
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
        done: "table",
      },
    ],
    measure: [
      {
        click: "#restock",
        done: () => {
          const cells = Array.from(document.querySelectorAll("tbody tr td:nth-of-type(7)"));
          return cells.length > 0 && cells.every(td => td.textContent !== "Out of Stock");
        },
      },
    ],
  },
];
