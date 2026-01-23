import { buildData, unitmap } from 'common/data';

let rows = [];
let selected = null;
let unitSystem = 'metric';

const tbody = document.getElementById('tbody');
const table = document.querySelector('table');
const noRowsMsg = document.getElementById('no-rows-msg');

// Map ID -> { data, el }
const rowMap = new Map();

// --- Templates & Helpers ---

// Pre-calculate conversions to avoid doing it inside loops if possible
// but 'unitSystem' changes, so we need a getter or update.
function getConversions() {
  return {
    weightConversion: unitSystem === 'metric' ? 1 : 2.20462,
    powerConversion: unitSystem === 'metric' ? 1 : 0.00134102,
    lengthConversion: unitSystem === 'metric' ? 1 : 0.393701
  };
}

// Create a template row to clone
const trTemplate = document.createElement('tr');
trTemplate.innerHTML = `
  <td class="col-id"></td>
  <td class="col-name"></td>
  <td class="col-weight"></td>
  <td class="col-dims"></td>
  <td class="col-power"></td>
  <td class="col-price"></td>
  <td class="col-status"></td>
  <td class="col-rating"></td>
  <td class="col-actions">
    <button class="small delete-btn">delete</button>
  </td>
`;

function createRowElement(row) {
  const tr = trTemplate.cloneNode(true);
  // Store ID on the element for event delegation lookups
  tr.dataset.id = row.id;
  updateRowContent(tr, row, getConversions());
  return tr;
}

function updateRowContent(tr, row, conversions) {
  const { weightConversion, powerConversion, lengthConversion } = conversions;
  // fast access via firstChild / nextSibling is faster than children[] or querySelector
  // let td = tr.firstChild;
  // Text nodes might exist if we didn't minify HTML, but innerHTML above has whitespace?
  // Actually above innerHTML has whitespace. checking children collection is safer.
  const cells = tr.children;

  cells[0].textContent = row.id;
  cells[1].textContent = row.name;
  cells[2].textContent = `${(row.weight * weightConversion).toFixed(1)} ${unitmap.weight[unitSystem]}`;
  cells[3].textContent = `${(row.dimensions.height * lengthConversion).toFixed(1)} x ${(row.dimensions.width * lengthConversion).toFixed(1)} x ${(row.dimensions.depth * lengthConversion).toFixed(1)} ${unitmap.length[unitSystem]}`;
  cells[4].textContent = `${(row.powerConsumption * powerConversion).toFixed(1)} ${unitmap.power[unitSystem]}`;
  cells[5].textContent = `$${row.price.toFixed(2)}`;
  cells[6].textContent = row.availabilityStatus;
  cells[7].textContent = row.rating.toFixed(1);
  
  // Selection class
  // if (selected === row.id) {
  //   tr.className = 'selected';
  // } else {
  //   tr.className = '';
  // }
}

function setTableVisible(visible) {
  if (visible) {
    noRowsMsg.style.display = 'none';
    table.style.display = 'table';
  } else {
    noRowsMsg.style.display = 'block';
    table.style.display = 'none';
  }
}

// --- Specific Actions ---

function run() { // Create 1000
  rows = buildData(1000);
  selected = null;
  
  // Clear and rebuild
  tbody.textContent = '';
  rowMap.clear();
  
  const fragment = document.createDocumentFragment();
  for (const row of rows) {
    const tr = createRowElement(row);
    rowMap.set(row.id, { data: row, el: tr });
    fragment.appendChild(tr);
  }
  tbody.appendChild(fragment);
  setTableVisible(true);
}

function add() { // Append 1000 -> Wait, React append was 1. Usually benchmarks are 1000.
  // The React code provided earlier: setRows([...rows, ...buildData(1)])
  // So append is 1.
  const newRows = buildData(1);
  rows = rows.concat(newRows);
  
  const fragment = document.createDocumentFragment();
  for (const row of newRows) {
    const tr = createRowElement(row);
    rowMap.set(row.id, { data: row, el: tr });
    fragment.appendChild(tr);
  }
  tbody.appendChild(fragment);
  setTableVisible(true);
}

function prepend() { // Prepend 1
  const newRows = buildData(1);
  rows = newRows.concat(rows);
  
  const fragment = document.createDocumentFragment();
  for (const row of newRows) {
    const tr = createRowElement(row);
    rowMap.set(row.id, { data: row, el: tr });
    fragment.appendChild(tr);
  }
  tbody.insertBefore(fragment, tbody.firstChild);
  setTableVisible(true);
}

function insert() { // Insert 1 at index 10
  if (rows.length < 10) {
      // Fallback if not enough rows, just append
      add(); 
      return;
  }
  const newRows = buildData(1);
  rows.splice(10, 0, ...newRows); // Insert into data array
  
  const fragment = document.createDocumentFragment();
  for (const row of newRows) {
    const tr = createRowElement(row);
    rowMap.set(row.id, { data: row, el: tr });
    fragment.appendChild(tr);
  }
  
  // Insert before the 11th element (index 10)
  // tbody.children is a live HTMLCollection
  const refNode = tbody.children[10]; 
  tbody.insertBefore(fragment, refNode);
  setTableVisible(true);
}

function update() { // Restock - partial update
  // "Restock" updates rows where status is "Out of Stock"
  // React: setRows(rows => rows.map(r => r.availabilityStatus === "Out of Stock" ? { ...r, availabilityStatus: "In Stock" } : r))
  
  // We can iterate DOM or data. Iterating data allows us to skip DOM updates if not needed.
  // Actually, we must update data reference too.
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.availabilityStatus === "Out of Stock") {
        row.availabilityStatus = "In Stock";
        // Update DOM
        const entry = rowMap.get(row.id);
        if (entry) {
            // Update only status cell (index 6)
            entry.el.children[6].textContent = "In Stock";
        }
    }
  }
}

function toggleUnits() {
  unitSystem = unitSystem === 'imperial' ? 'metric' : 'imperial';
  const conversions = getConversions();
  // Must update all rows
  for (let i = 0; i < rows.length; i++) {
      const entry = rowMap.get(rows[i].id);
      if (entry) {
          updateRowContent(entry.el, entry.data, conversions);
      }
  }
}

function clear() {
  rows = [];
  rowMap.clear();
  tbody.textContent = '';
  selected = null;
  setTableVisible(false);
}

function reverse() {
  rows.reverse();
  for (let i = 0; i < rows.length; i++) {
      const entry = rowMap.get(rows[i].id);
      tbody.appendChild(entry.el); 
  }
}

function sort() {
  rows.sort((a, b) => a.name.localeCompare(b.name));
  for (let i = 0; i < rows.length; i++) {
      const entry = rowMap.get(rows[i].id);
      tbody.appendChild(entry.el);
  }
}

function filter() {
    // React: rows.filter(d => d.id % 2) -> Keeps odd IDs?
    // "id % 2" is truthy for odd numbers (1), falsy for even (0).
    // So keeps odd IDs.
    
    // We need to remove even IDs.
    const toRemove = [];
    const keptRows = [];
    
    for (const row of rows) {
        if (row.id % 2) {
            keptRows.push(row);
        } else {
            toRemove.push(row);
        }
    }
    
    rows = keptRows;
    
    for (const row of toRemove) {
        const entry = rowMap.get(row.id);
        if (entry) {
            entry.el.remove();
            rowMap.delete(row.id);
        }
    }
}

// --- Event Delegation ---

tbody.addEventListener('click', (e) => {
  const target = e.target;
  const tr = target.closest('tr');
  if (!tr) return;
  if (target.classList.contains('delete-btn')) {
      tr.remove();
      rows = rows.filter(r => r.id !== Number(tr.dataset.id));
      rowMap.delete(Number(tr.dataset.id));
      if (selected === tr) {
          selected = null;
      }
      return;
  }
  selected?.classList.remove('selected');
  tr.classList.toggle('selected');
  selected = tr;
});


// --- Bind Actions ---

document.getElementById('create').onclick = run;
document.getElementById('reverse').onclick = reverse;
document.getElementById('insert').onclick = insert;
document.getElementById('prepend').onclick = prepend;
document.getElementById('append').onclick = add; // 'append' ID maps to 'add' func
document.getElementById('sort').onclick = sort;
document.getElementById('filter').onclick = filter;
document.getElementById('units').onclick = toggleUnits;
document.getElementById('restock').onclick = update;
document.getElementById('clear').onclick = clear;

// Initial state
setTableVisible(false);
