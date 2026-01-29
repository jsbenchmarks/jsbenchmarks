import { buildData, unitmap } from "common/data";
import "common/main.css";
import { streamUpdates } from "common/streaming";

let selectedTr = null;
let isMetric = true;
let stopStreaming = null;

const table = document.querySelector("table");
let tbody = document.querySelector("tbody");
const noRowsMsg = document.getElementById("no-rows-msg");

let hasRows = null;
function setHasRows(next) {
  if (next === hasRows) return;
  hasRows = next;
  if (next) {
    noRowsMsg.replaceWith(table);
  } else {
    table.replaceWith(noRowsMsg);
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

  let node = tr.firstChild;
  const idNode = node.firstChild;
  node = node.nextSibling;
  const nameNode = node.firstChild;
  node = node.nextSibling;
  const weightNode = node.firstChild;
  node = node.nextSibling;
  const dimsNode = node.firstChild;
  node = node.nextSibling;
  const powerNode = node.firstChild;
  node = node.nextSibling;
  const priceNode = node.firstChild;
  node = node.nextSibling;
  const statusNode = node.firstChild;
  node = node.nextSibling;
  const ratingNode = node.firstChild;

  // Cache only what the benchmarks need after creation.
  tr._id = row.id;
  tr._name = row.name;
  tr._w = weightNode;
  tr._d = dimsNode;
  tr._p = powerNode;
  tr._s = statusNode;
  tr._price = priceNode;
  tr._availabilityStatus = row.availabilityStatus;

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

  idNode.nodeValue = row.id;
  nameNode.nodeValue = row.name;
  if (isMetric) {
    weightNode.nodeValue = mw;
    dimsNode.nodeValue = md;
    powerNode.nodeValue = mp;
  } else {
    weightNode.nodeValue = iw;
    dimsNode.nodeValue = id;
    powerNode.nodeValue = ip;
  }
  priceNode.nodeValue = "$" + row.price.toFixed(2);
  statusNode.nodeValue = row.availabilityStatus;
  ratingNode.nodeValue = row.rating.toFixed(1);

  return tr;
}

function create() {
  if (stopStreaming) {
    stopStreaming();
    stopStreaming = null;
  }
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

function setButtonsDisabled(disabled) {
  const buttons = document.querySelectorAll("button");
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i].id !== "stream") {
      buttons[i].disabled = disabled;
    }
  }
}

function stream(e) {
  if (stopStreaming) {
    e.target.textContent = "Stream";
    stopStreaming();
    stopStreaming = null;
    setButtonsDisabled(false);
    return;
  }
  e.target.textContent = "Stop";
  const rows = buildData(25);
  selectedTr = null;

  const nextBody = document.createElement("tbody");
  nextBody.id = "tbody";

  for (let i = 0; i < rows.length; i++) {
    nextBody.appendChild(createRow(rows[i]));
  }
  
  table.replaceChild(nextBody, tbody);
  tbody = nextBody;
  setHasRows(true);
  setButtonsDisabled(true);

  const trs = tbody.children;
  const map = new Map();
  for (let i = 0; i < trs.length; i++) {
    map.set(trs[i]._id, trs[i]);
  }

  stopStreaming = streamUpdates((updates) => {
    for (const update of updates) {
      const tr = map.get(update.id);
      if (tr) {
        if (update.price) {
          tr._price.nodeValue = "$" + update.price.toFixed(2);
        }
        if (update.availabilityStatus) {
          tr._availabilityStatus = update.availabilityStatus;
          tr._s.nodeValue = update.availabilityStatus;
        }
      }
    }
  });
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
  if (stopStreaming) {
    stopStreaming();
    stopStreaming = null;
  }
  setHasRows(false);
  tbody.textContent = "";
  selectedTr = null;
}

function reverse() {
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
    if ((cur._id & 1) === 0) {
      cur.remove();
    }
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
      tr._w.nodeValue = tr._mw;
      tr._d.nodeValue = tr._md;
      tr._p.nodeValue = tr._mp;
    }
    return;
  }
  for (let i = 0; i < rows.length; i++) {
    const tr = rows[i];
    tr._w.nodeValue = tr._iw;
    tr._d.nodeValue = tr._idim;
    tr._p.nodeValue = tr._ip;
  }
}

function restock() {
  const rows = tbody.children;
  for (let i = 0; i < rows.length; i++) {
    const tr = rows[i];
    if (tr._availabilityStatus === "Out of Stock") {
      tr._availabilityStatus = "In Stock";
      tr._s.nodeValue = "In Stock";
    }
  }
}

table.onclick = e => {
  if (stopStreaming) return;
  e.stopPropagation();
  let target = e.target;
  if (target.nodeType === 3) target = target.parentNode;
  if (target.tagName === "BUTTON") {
    const tr = target.parentNode && target.parentNode.parentNode;
    if (!tr || tr.parentNode !== tbody) return;
    if (selectedTr === tr) selectedTr = null;
    tr.remove();
    if (!tbody.firstElementChild) setHasRows(false);
    return;
  }
  const tr = target.closest("tr");
  if (!tr) return;
  tr.classList.add("selected");
  if (selectedTr) selectedTr.classList.remove("selected");
  selectedTr = tr;
};

document.getElementById("create").onclick = create;
document.getElementById("stream").onclick = stream;
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
