import { buildData, unitmap } from "common/data";

let selectedTr = null;
let isMetric = true;

const table = document.querySelector("table");
let tbody = document.querySelector("tbody");
const noRowsMsg = document.getElementById("no-rows-msg");

let hasRows = null;
function setHasRows(next) {
  if (next === hasRows) return;
  hasRows = next;
  if (next) {
    noRowsMsg.style.display = "none";
    table.style.display = "table";
  } else {
    noRowsMsg.style.display = "block";
    table.style.display = "none";
  }
}

// Row template: keep text nodes as firstChild for fast updates.
const rowTemplate = document.createElement("template");
rowTemplate.innerHTML =
  "<tr>" +
  "<td> </td>" +
  "<td> </td>" +
  "<td> </td>" +
  "<td> </td>" +
  "<td> </td>" +
  "<td> </td>" +
  "<td> </td>" +
  "<td> </td>" +
  '<td><button class=\"small delete-btn\">delete</button></td>' +
  "</tr>";

const rowProto = rowTemplate.content.firstElementChild;

function createRow(row) {
  const tr = rowProto.cloneNode(true);
  const c = tr.children;

  const idNode = c[0].firstChild;
  const nameNode = c[1].firstChild;
  const weightNode = c[2].firstChild;
  const dimsNode = c[3].firstChild;
  const powerNode = c[4].firstChild;
  const priceNode = c[5].firstChild;
  const statusNode = c[6].firstChild;
  const ratingNode = c[7].firstChild;

  // Cache only what the benchmarks need after creation.
  tr._id = row.id;
  tr._name = row.name;
  tr._status = row.availabilityStatus;
  tr._w = weightNode;
  tr._d = dimsNode;
  tr._p = powerNode;
  tr._s = statusNode;

  // Precompute both unit formats so toggling is just swapping strings.
  const dim = row.dimensions;
  const h = dim.height;
  const w = dim.width;
  const d = dim.depth;

  const mw = row.weight.toFixed(1) + " " + unitmap.weight.metric;
  const md =
    h.toFixed(1) +
    " x " +
    w.toFixed(1) +
    " x " +
    d.toFixed(1) +
    " " +
    unitmap.length.metric;
  const mp = row.powerConsumption.toFixed(1) + " " + unitmap.power.metric;

  const iw = (row.weight * 2.20462).toFixed(1) + " " + unitmap.weight.imperial;
  const id =
    (h * 0.393701).toFixed(1) +
    " x " +
    (w * 0.393701).toFixed(1) +
    " x " +
    (d * 0.393701).toFixed(1) +
    " " +
    unitmap.length.imperial;
  const ip =
    (row.powerConsumption * 0.00134102).toFixed(1) + " " + unitmap.power.imperial;

  tr._mw = mw;
  tr._md = md;
  tr._mp = mp;
  tr._iw = iw;
  tr._idim = id;
  tr._ip = ip;

  idNode.data = row.id;
  nameNode.data = row.name;
  if (isMetric) {
    weightNode.data = mw;
    dimsNode.data = md;
    powerNode.data = mp;
  } else {
    weightNode.data = iw;
    dimsNode.data = id;
    powerNode.data = ip;
  }
  priceNode.data = "$" + row.price.toFixed(2);
  statusNode.data = row.availabilityStatus;
  ratingNode.data = row.rating.toFixed(1);

  return tr;
}

function create() {
  const rows = buildData(1000);
  selectedTr = null;

  const nextBody = document.createElement("tbody");
  nextBody.id = "tbody";

  for (let i = 0; i < rows.length; i++) {
    nextBody.appendChild(createRow(rows[i]));
  }

  table.replaceChild(nextBody, tbody);
  tbody = nextBody;
  setHasRows(true);
}

function append() {
  const row = buildData(1)[0];
  tbody.appendChild(createRow(row));
  setHasRows(true);
}

function prepend() {
  const row = buildData(1)[0];
  const first = tbody.firstChild;
  if (first) tbody.insertBefore(createRow(row), first);
  else tbody.appendChild(createRow(row));
  setHasRows(true);
}

function insert() {
  const row = buildData(1)[0];
  const ref = tbody.children[10];
  if (ref) tbody.insertBefore(createRow(row), ref);
  else tbody.appendChild(createRow(row));
  setHasRows(true);
}

function clear() {
  tbody.textContent = "";
  selectedTr = null;
  setHasRows(false);
}

function reverse() {
  // Move last->first into a fragment (no arrays).
  const frag = document.createDocumentFragment();
  while (tbody.lastChild) frag.appendChild(tbody.lastChild);
  tbody.appendChild(frag);
}

function sort() {
  const len = tbody.children.length;
  if (len < 2) return;

  const arr = new Array(len);
  for (let i = 0; i < len; i++) arr[i] = tbody.children[i];

  arr.sort((a, b) => a._name.localeCompare(b._name));

  const frag = document.createDocumentFragment();
  for (let i = 0; i < len; i++) frag.appendChild(arr[i]);
  tbody.appendChild(frag);
}

function filter() {
  let cur = tbody.lastElementChild;
  while (cur) {
    const prev = cur.previousElementSibling;
    if ((cur._id & 1) === 0) cur.remove();
    cur = prev;
  }
  if (!tbody.firstElementChild) setHasRows(false);
}

function toggleUnits() {
  isMetric = !isMetric;
  const rows = tbody.children;
  if (isMetric) {
    for (let i = 0; i < rows.length; i++) {
      const tr = rows[i];
      tr._w.data = tr._mw;
      tr._d.data = tr._md;
      tr._p.data = tr._mp;
    }
    return;
  }
  for (let i = 0; i < rows.length; i++) {
    const tr = rows[i];
    tr._w.data = tr._iw;
    tr._d.data = tr._idim;
    tr._p.data = tr._ip;
  }
}

function restock() {
  const rows = tbody.children;
  for (let i = 0; i < rows.length; i++) {
    const tr = rows[i];
    if (tr._status === "Out of Stock") {
      tr._status = "In Stock";
      tr._s.data = "In Stock";
    }
  }
}

table.addEventListener("click", (e) => {
  let target = e.target;
  if (target && target.nodeType === 3) target = target.parentNode;

  // Fast path: delete button lives at tr > td > button.
  if (target && target.classList && target.classList.contains("delete-btn")) {
    const tr = target.parentNode && target.parentNode.parentNode;
    if (!tr || tr.parentNode !== tbody) return;
    if (selectedTr === tr) selectedTr = null;
    tr.remove();
    if (!tbody.firstElementChild) setHasRows(false);
    return;
  }

  const tr = target && target.closest ? target.closest("tr") : null;
  if (!tr || tr.parentNode !== tbody) return;

  if (selectedTr) selectedTr.classList.remove("selected");
  tr.classList.add("selected");
  selectedTr = tr;
});

document.getElementById("create").onclick = create;
document.getElementById("reverse").onclick = reverse;
document.getElementById("insert").onclick = insert;
document.getElementById("prepend").onclick = prepend;
document.getElementById("append").onclick = append;
document.getElementById("sort").onclick = sort;
document.getElementById("filter").onclick = filter;
document.getElementById("units").onclick = toggleUnits;
document.getElementById("restock").onclick = restock;
document.getElementById("clear").onclick = clear;

setHasRows(false);
