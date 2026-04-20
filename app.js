const DATA_URL = "./songs.json";

const state = {
  rows: [],
  filteredRows: [],
  sort: { col: "last_updated", dir: "desc" },
};

let searchInput, clearButton, resultsBody, statusText, emptyStateTemplate;

async function loadData() {
  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status}`);
    }

    const data = await response.json();
    state.rows = data;
    state.filteredRows = data;
    renderRows(sortRows(data));
    updateStatus();
  } catch (error) {
    resultsBody.innerHTML = "";
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="4" class="empty-state">Could not load sample data.</td>`;
    resultsBody.appendChild(row);
    statusText.textContent = error.message;
  }
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function sortRows(rows) {
  const { col, dir } = state.sort;
  return [...rows].sort((a, b) => {
    let aVal = a[col] ?? "";
    let bVal = b[col] ?? "";

    if (col === "last_updated") {
      aVal = new Date(aVal).getTime() || 0;
      bVal = new Date(bVal).getTime() || 0;
      return dir === "asc" ? aVal - bVal : bVal - aVal;
    }

    aVal = normalize(aVal);
    bVal = normalize(bVal);
    if (aVal < bVal) return dir === "asc" ? -1 : 1;
    if (aVal > bVal) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

function applySort(col) {
  if (state.sort.col === col) {
    state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
  } else {
    state.sort.col = col;
    state.sort.dir = col === "last_updated" ? "desc" : "asc";
  }

  // Update aria-sort on all headers
  document.querySelectorAll("thead th[data-col]").forEach((th) => {
    if (th.dataset.col === col) {
      th.setAttribute("aria-sort", state.sort.dir === "asc" ? "ascending" : "descending");
    } else {
      th.setAttribute("aria-sort", "none");
    }
  });

  renderRows(sortRows(state.filteredRows));
}


  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    state.filteredRows = state.rows;
    renderRows(sortRows(state.filteredRows));
    updateStatus();
    return;
  }

  state.filteredRows = state.rows.filter((row) => {
    const haystack = [
      row.artist,
      row.song,
      row.plan_name,
    ]
      .map(normalize)
      .join(" ");

    return haystack.includes(normalizedQuery);
  });

  renderRows(sortRows(state.filteredRows));
  updateStatus(normalizedQuery);
}

function renderRows(rows) {
  resultsBody.innerHTML = "";

  if (rows.length === 0) {
    const emptyRow = emptyStateTemplate.content.firstElementChild.cloneNode(true);
    resultsBody.appendChild(emptyRow);
    return;
  }

  const fragment = document.createDocumentFragment();

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(row.artist)}</td>
      <td>${escapeHtml(row.song)}</td>
      <td>${escapeHtml(row.plan_name)}</td>
      <td>${escapeHtml(formatDate(row.last_updated))}</td>
    `;
    fragment.appendChild(tr);
  });

  resultsBody.appendChild(fragment);
}

function updateStatus(query = "") {
  const resultCount = state.filteredRows.length;
  const totalCount = state.rows.length;

  if (!query) {
    statusText.textContent = `${totalCount} songs loaded`;
    return;
  }

  statusText.textContent = `${resultCount} match${resultCount === 1 ? "" : "es"} for "${query}"`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

document.addEventListener("DOMContentLoaded", () => {
  searchInput = document.querySelector("#searchInput");
  clearButton = document.querySelector("#clearButton");
  resultsBody = document.querySelector("#resultsBody");
  statusText = document.querySelector("#statusText");
  emptyStateTemplate = document.querySelector("#emptyStateTemplate");

  document.querySelectorAll("thead th[data-col]").forEach((th) => {
    th.addEventListener("click", () => applySort(th.dataset.col));
    th.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        applySort(th.dataset.col);
      }
    });
  });

  searchInput.addEventListener("input", (event) => {
    filterRows(event.target.value);
  });

  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    filterRows("");
    searchInput.focus();
  });

  loadData();
});
