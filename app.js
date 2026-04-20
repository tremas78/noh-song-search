const DATA_URL = "./songs.json";

const state = {
  rows: [],
  filteredRows: [],
};

const searchInput = document.querySelector("#searchInput");
const clearButton = document.querySelector("#clearButton");
const resultsBody = document.querySelector("#resultsBody");
const statusText = document.querySelector("#statusText");
const emptyStateTemplate = document.querySelector("#emptyStateTemplate");

async function loadData() {
  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status}`);
    }

    const data = await response.json();
    state.rows = data;
    state.filteredRows = data;
    renderRows(data);
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

function filterRows(query) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    state.filteredRows = state.rows;
    renderRows(state.filteredRows);
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

  renderRows(state.filteredRows);
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

searchInput.addEventListener("input", (event) => {
  filterRows(event.target.value);
});

clearButton.addEventListener("click", () => {
  searchInput.value = "";
  filterRows("");
  searchInput.focus();
});

loadData();
