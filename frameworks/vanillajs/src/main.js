import { buildData } from 'common/data';

let selected = null;
let unitSystem = 'metric';

const tbody = document.getElementById('tbody');
const table = document.querySelector('table');
const noRowsMsg = document.getElementById('no-rows-msg');

// Cache Node methods for slightly faster access in tight loops
const { cloneNode } = Node.prototype;
const clone = n => cloneNode.call(n, true);

// --- Templates & Helpers ---

const trTemplate = document.createElement('tr');
trTemplate.innerHTML = `
  <td class="col-id"> </td>
  <td class="col-name"> </td>
  <td class="col-weight"> </td>
  <td class="col-dims"> </td>
  <td class="col-power"> </td>
  <td class="col-price"> </td>
  <td class="col-status"> </td>
  <td class="col-rating"> </td>
  <td class="col-actions">
    <button class="small delete-btn">delete</button>
  </td>
`;

function createRowElement(row) {
  const tr = clone(trTemplate);
  tr._data = row;
  
  // Cache text node references for fast updates
  const cells = tr.cells;
  tr._nodes = {
    id: cells[0].firstChild,
    name: cells[1].firstChild,
    weight: cells[2].firstChild,
    dims: cells[3].firstChild,
    power: cells[4].firstChild,
    price: cells[5].firstChild,
    status: cells[6].firstChild,
    rating: cells[7].firstChild
  };
  
  // Pre-compute both unit formats (eliminates toFixed on toggle)
  const h = row.dimensions.height, w = row.dimensions.width, d = row.dimensions.depth;
  tr._fmt = {
    metric: {
      weight: row.weight.toFixed(1) + ' kg',
      dims: h.toFixed(1) + ' x ' + w.toFixed(1) + ' x ' + d.toFixed(1) + ' cm',
      power: row.powerConsumption.toFixed(1) + ' w'
    },
    imperial: {
      weight: (row.weight * 2.20462).toFixed(1) + ' lbs',
      dims: (h * 0.393701).toFixed(1) + ' x ' + (w * 0.393701).toFixed(1) + ' x ' + (d * 0.393701).toFixed(1) + ' in',
      power: (row.powerConsumption * 0.00134102).toFixed(1) + ' hp'
    }
  };
  
  // Set initial content using cached format
  const n = tr._nodes, fmt = tr._fmt[unitSystem];
  n.id.data = row.id;
  n.name.data = row.name;
  n.weight.data = fmt.weight;
  n.dims.data = fmt.dims;
  n.power.data = fmt.power;
  n.price.data = '$' + row.price.toFixed(2);
  n.status.data = row.availabilityStatus;
  n.rating.data = row.rating.toFixed(1);
  
  return tr;
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

function run() {
  const rows = buildData(1000);
  selected = null;
  tbody.remove();
  tbody.textContent = '';
  // Use DocumentFragment for batched DOM insertion
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < rows.length; i++) {
    fragment.appendChild(createRowElement(rows[i]));
  }
  tbody.appendChild(fragment);
  table.appendChild(tbody);
  setTableVisible(true);
}

function add() {
  const newRows = buildData(1);
  for (const row of newRows) {
    tbody.appendChild(createRowElement(row));
  }
  setTableVisible(true);
}

function prepend() {
  const newRows = buildData(1);
  const firstChild = tbody.firstChild;
  for (const row of newRows) {
    tbody.insertBefore(createRowElement(row), firstChild);
  }
  setTableVisible(true);
}

function insert() {
  if (tbody.children.length < 10) {
      add();
      return;
  }
  const newRows = buildData(1);
  const refNode = tbody.children[10];
  for (const row of newRows) {
    tbody.insertBefore(createRowElement(row), refNode);
  }
  setTableVisible(true);
}

function update() {
  const rows = tbody.children;
  const len = rows.length;
  for (let i = 0; i < len; i++) {
    const tr = rows[i];
    const data = tr._data;
    if (data.availabilityStatus === "Out of Stock") {
      data.availabilityStatus = "In Stock";
      tr._nodes.status.data = "In Stock";
    }
  }
}

function toggleUnits() {
  unitSystem = unitSystem === 'imperial' ? 'metric' : 'imperial';
  
  const rows = tbody.children;
  const len = rows.length;
  
  for (let i = 0; i < len; i++) {
    const tr = rows[i];
    const n = tr._nodes;
    const fmt = tr._fmt[unitSystem];  // Just swap cached strings!
    n.weight.data = fmt.weight;
    n.dims.data = fmt.dims;
    n.power.data = fmt.power;
  }
}

function clear() {
  tbody.textContent = '';
  selected = null;
  setTableVisible(false);
}

function reverse() {
  const rows = Array.from(tbody.children);
  tbody.remove();
  // Use DocumentFragment for batched re-insertion
  const fragment = document.createDocumentFragment();
  for (let i = rows.length - 1; i >= 0; i--) {
    fragment.appendChild(rows[i]);
  }
  tbody.appendChild(fragment);
  table.appendChild(tbody);
}

function sort() {
  const rows = Array.from(tbody.children);
  tbody.remove();
  
  // Fast string comparison instead of localeCompare
  rows.sort((a, b) => {
    const nameA = a._data.name;
    const nameB = b._data.name;
    return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
  });
  
  // Use DocumentFragment for batched re-insertion
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < rows.length; i++) {
    fragment.appendChild(rows[i]);
  }
  tbody.appendChild(fragment);
  table.appendChild(tbody);
}

function filter() {
    let cursor = tbody.lastChild;
    while (cursor) {
        const prev = cursor.previousSibling;
        if (cursor._data.id % 2 === 0) {
            cursor.remove();
        }
        cursor = prev;
    }
}

// --- Event Delegation ---

tbody.addEventListener('click', (e) => {
  e.stopPropagation();
  const target = e.target;
  const tr = target.closest('tr');
  if (!tr) return;
  
  if (target.classList.contains('delete-btn')) {
      if (selected === tr) {
          selected = null;
      }
      tr.remove();
      return;
  }
  
  if (selected) selected.classList.remove('selected');
  tr.classList.add('selected');
  selected = tr;
});


// --- Bind Actions ---

document.getElementById('create').onclick = run;
document.getElementById('reverse').onclick = reverse;
document.getElementById('insert').onclick = insert;
document.getElementById('prepend').onclick = prepend;
document.getElementById('append').onclick = add;
document.getElementById('sort').onclick = sort;
document.getElementById('filter').onclick = filter;
document.getElementById('units').onclick = toggleUnits;
document.getElementById('restock').onclick = update;
document.getElementById('clear').onclick = clear;

// Initial state
setTableVisible(false);
