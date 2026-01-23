import { buildData, unitmap } from 'common/data';

let selected = null;
let unitSystem = 'metric';

const tbody = document.getElementById('tbody');
const table = document.querySelector('table');
const noRowsMsg = document.getElementById('no-rows-msg');

// Cache Node methods for slightly faster access in tight loops
const { cloneNode } = Node.prototype;
const clone = n => cloneNode.call(n, true);

// --- Templates & Helpers ---

function getConversions() {
  return {
    weightConversion: unitSystem === 'metric' ? 1 : 2.20462,
    powerConversion: unitSystem === 'metric' ? 1 : 0.00134102,
    lengthConversion: unitSystem === 'metric' ? 1 : 0.393701
  };
}

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

function createRowElement(row, conversions) {
  const tr = clone(trTemplate);
  tr._data = row;
  updateRowContent(tr, row, conversions);
  return tr;
}

function updateRowContent(tr, row, conversions) {
  const { weightConversion, powerConversion, lengthConversion } = conversions;
  const cells = tr.cells;
  cells[0].firstChild.data = row.id;
  cells[1].firstChild.data = row.name;
  cells[2].firstChild.data = `${(row.weight * weightConversion).toFixed(1)} ${unitmap.weight[unitSystem]}`;
  cells[3].firstChild.data = `${(row.dimensions.height * lengthConversion).toFixed(1)} x ${(row.dimensions.width * lengthConversion).toFixed(1)} x ${(row.dimensions.depth * lengthConversion).toFixed(1)} ${unitmap.length[unitSystem]}`;
  cells[4].firstChild.data = `${(row.powerConsumption * powerConversion).toFixed(1)} ${unitmap.power[unitSystem]}`;
  cells[5].firstChild.data = `$${row.price.toFixed(2)}`;
  cells[6].firstChild.data = row.availabilityStatus;
  cells[7].firstChild.data = row.rating.toFixed(1);
}

function updateRowUnits(tr, conversions) {
  const { weightConversion, powerConversion, lengthConversion } = conversions;
  const cells = tr.children;
  const row = tr._data;
  cells[2].textContent = `${(row.weight * weightConversion).toFixed(1)} ${unitmap.weight[unitSystem]}`;
  cells[3].textContent = `${(row.dimensions.height * lengthConversion).toFixed(1)} x ${(row.dimensions.width * lengthConversion).toFixed(1)} x ${(row.dimensions.depth * lengthConversion).toFixed(1)} ${unitmap.length[unitSystem]}`;
  cells[4].textContent = `${(row.powerConsumption * powerConversion).toFixed(1)} ${unitmap.power[unitSystem]}`;
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
  const conversions = getConversions();
  tbody.remove();
  tbody.textContent = '';
  for (let i = 0; i < rows.length; i++) {
    tbody.appendChild(createRowElement(rows[i], conversions));
  }
  table.appendChild(tbody);
  setTableVisible(true);
}

function add() {
  const newRows = buildData(1);
  const conversions = getConversions();
  for (const row of newRows) {
    tbody.appendChild(createRowElement(row, conversions));
  }
  setTableVisible(true);
}

function prepend() {
  const newRows = buildData(1);
  const conversions = getConversions();
  const firstChild = tbody.firstChild;
  for (const row of newRows) {
    tbody.insertBefore(createRowElement(row, conversions), firstChild);
  }
  setTableVisible(true);
}

function insert() {
  if (tbody.children.length < 10) {
      add();
      return;
  }
  const newRows = buildData(1);
  const conversions = getConversions();
  const refNode = tbody.children[10];
  for (const row of newRows) {
    tbody.insertBefore(createRowElement(row, conversions), refNode);
  }
  setTableVisible(true);
}

function update() {
  const rows = tbody.children;
  for (let i = 0; i < rows.length; i++) {
    const tr = rows[i];
    const data = tr._data;
    if (data.availabilityStatus === "Out of Stock") {
        data.availabilityStatus = "In Stock";
        tr.children[6].textContent = "In Stock";
    }
  }
}

function toggleUnits() {
  unitSystem = unitSystem === 'imperial' ? 'metric' : 'imperial';
  const conversions = getConversions();
  const rows = tbody.children;
  for (let i = 0; i < rows.length; i++) {
      updateRowUnits(rows[i], conversions);
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
  for (let i = rows.length - 1; i >= 0; i--) {
      tbody.appendChild(rows[i]);
  }
  table.appendChild(tbody);
}

function sort() {
  const rows = Array.from(tbody.children);
  tbody.remove();
  
  rows.sort((a, b) => a._data.name.localeCompare(b._data.name));
  
  for (let i = 0; i < rows.length; i++) {
      tbody.appendChild(rows[i]);
  }
  
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
