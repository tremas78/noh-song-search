const DATA_URL = "./songs.json";

const state = {
  rows: [],
  filteredRows: [],
  sort: {
    key: "last_updated",
    direction: "desc",
  },
};

const searchInput = document.querySelector("#searchInput");
const clearButton = document.querySelector("#clearButton");
const resultsBody = document.querySelector("#resultsBody");
const statusText = document.querySelector("#statusText");
const emptyStateTemplate = document.querySelector("#emptyStateTemplate");
const sortButtons = document.querySelectorAll(".sort-button");
const backToTopButton = document.querySelector("#backToTopButton");

async function loadData() {
  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status}`);
    }

    const data = await response.json();
    state.rows = data;
    state.filteredRows = data;
    renderRows(state.filteredRows);
    updateSortButtons();
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

function getComparableValue(row, key) {
  const value = row[key];

  if (key === "last_updated") {
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
  }

  return normalize(value);
}

function sortRows(rows) {
  const { key, direction } = state.sort;
  const multiplier = direction === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    const leftValue = getComparableValue(left, key);
    const rightValue = getComparableValue(right, key);

    if (leftValue < rightValue) {
      return -1 * multiplier;
    }

    if (leftValue > rightValue) {
      return 1 * multiplier;
    }

    return 0;
  });
}

function applyCurrentView(query = "") {
  renderRows(state.filteredRows);
  updateSortButtons();
  updateStatus(query);
}

function filterRows(query) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    state.filteredRows = state.rows;
    applyCurrentView();
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

  applyCurrentView(normalizedQuery);
}

function renderRows(rows) {
  const sortedRows = sortRows(rows);
  resultsBody.innerHTML = "";

  if (sortedRows.length === 0) {
    const emptyRow = emptyStateTemplate.content.firstElementChild.cloneNode(true);
    resultsBody.appendChild(emptyRow);
    return;
  }

  const fragment = document.createDocumentFragment();

  sortedRows.forEach((row) => {
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

function updateSortButtons() {
  sortButtons.forEach((button) => {
    const isActive = button.dataset.sortKey === state.sort.key;
    const direction = isActive ? state.sort.direction : "none";
    const headerCell = button.closest("th");
    const ariaSort = direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none";

    button.dataset.direction = direction;
    headerCell?.setAttribute("aria-sort", ariaSort);
    button.setAttribute(
      "aria-label",
      `Sort by ${button.textContent.trim()}${isActive ? ` (${direction === "asc" ? "ascending" : "descending"})` : ""}`
    );
  });
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

function updateBackToTopVisibility() {
  const isVisible = window.scrollY > 320;
  backToTopButton?.classList.toggle("is-visible", isVisible);
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

backToTopButton?.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

sortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { sortKey } = button.dataset;

    if (state.sort.key === sortKey) {
      state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
    } else {
      state.sort.key = sortKey;
      state.sort.direction = sortKey === "last_updated" ? "desc" : "asc";
    }

    applyCurrentView(searchInput.value);
  });
});

window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });

loadData();
updateBackToTopVisibility();
