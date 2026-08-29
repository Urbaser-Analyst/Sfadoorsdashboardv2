/* =====================================================================
   WIDGETS — small reusable UI controls shared across views.
   Currently: the global Customer filter, a searchable multiselect
   dropdown (checkbox list behind a search box, with chip-style summary
   on the toggle button).
   ===================================================================== */

// Normalized customer keys currently selected in the global Customer filter.
// Empty set = "All customers" (no filtering).
let SELECTED_CUSTOMER_KEYS = new Set();
let CUSTOMER_MS_OPTIONS = []; // [{ key, name }]

function customerMsLabel() {
  if (SELECTED_CUSTOMER_KEYS.size === 0) return "All customers";
  if (SELECTED_CUSTOMER_KEYS.size === 1) {
    const key = Array.from(SELECTED_CUSTOMER_KEYS)[0];
    const opt = CUSTOMER_MS_OPTIONS.find(o => o.key === key);
    return opt ? opt.name : "1 selected";
  }
  return `${SELECTED_CUSTOMER_KEYS.size} customers selected`;
}

function renderCustomerMsOptions(filterText) {
  const list = document.getElementById("customerMsOptions");
  if (!list) return;
  const q = (filterText || "").trim().toLowerCase();
  const filtered = q ? CUSTOMER_MS_OPTIONS.filter(o => o.name.toLowerCase().includes(q)) : CUSTOMER_MS_OPTIONS;

  if (!filtered.length) {
    list.innerHTML = `<div class="ms-empty">No customers match "${filterText}".</div>`;
    return;
  }
  list.innerHTML = filtered.map(o => `
    <label class="ms-option">
      <input type="checkbox" value="${o.key}" ${SELECTED_CUSTOMER_KEYS.has(o.key) ? "checked" : ""}>
      <span>${o.name}</span>
    </label>`).join("");

  list.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", () => {
      if (cb.checked) SELECTED_CUSTOMER_KEYS.add(cb.value); else SELECTED_CUSTOMER_KEYS.delete(cb.value);
      const toggle = document.getElementById("customerMsToggle");
      if (toggle) toggle.textContent = customerMsLabel() + " ▾";
      if (typeof DB !== "undefined" && DB) renderApp(DB);
    });
  });
}

function resetCustomerMultiSelect() {
  SELECTED_CUSTOMER_KEYS.clear();
  const toggle = document.getElementById("customerMsToggle");
  if (toggle) toggle.textContent = customerMsLabel() + " ▾";
  const searchInput = document.getElementById("customerMsSearch");
  if (searchInput) searchInput.value = "";
  renderCustomerMsOptions("");
}

function initCustomerMultiSelect(DBRef) {
  CUSTOMER_MS_OPTIONS = (DBRef.customerNameList || [])
    .map(name => ({ key: normName(name), name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Drop any previously-selected keys that no longer exist after a refresh.
  Array.from(SELECTED_CUSTOMER_KEYS).forEach(k => {
    if (!CUSTOMER_MS_OPTIONS.some(o => o.key === k)) SELECTED_CUSTOMER_KEYS.delete(k);
  });

  const toggle = document.getElementById("customerMsToggle");
  const panel = document.getElementById("customerMsPanel");
  const searchInput = document.getElementById("customerMsSearch");
  if (!toggle || !panel || !searchInput) return;

  toggle.textContent = customerMsLabel() + " ▾";
  renderCustomerMsOptions(searchInput.value);

  if (toggle.dataset.wired) return; // wire event listeners once only
  toggle.dataset.wired = "1";

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
    if (!panel.hidden) searchInput.focus();
  });
  searchInput.addEventListener("click", (e) => e.stopPropagation());
  searchInput.addEventListener("input", () => renderCustomerMsOptions(searchInput.value));
  document.getElementById("customerMsPanel").addEventListener("click", (e) => e.stopPropagation());

  const clearBtn = document.getElementById("customerMsClear");
  if (clearBtn) clearBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    resetCustomerMultiSelect();
    if (typeof DB !== "undefined" && DB) renderApp(DB);
  });
  const doneBtn = document.getElementById("customerMsDone");
  if (doneBtn) doneBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.hidden = true;
  });
  document.addEventListener("click", (e) => {
    const wrap = document.getElementById("customerMsDropdown");
    if (wrap && !wrap.contains(e.target)) panel.hidden = true;
  });
}

/* ================= GENERIC NATIVE MULTISELECT (used by Product Analysis slicers) ================= */
function multiSelectHtml(id, options, selectedSet) {
  const size = Math.min(6, Math.max(3, options.length || 1));
  return `<select id="${id}" multiple size="${size}">${
    options.map(o => `<option value="${String(o).replace(/"/g, '&quot;')}" ${selectedSet.has(o) ? "selected" : ""}>${o}</option>`).join("")
  }</select>`;
}

/* ================= RADIO GROUP (Credit / Paid / All slicers, etc.) ================= */
function radioGroupHtml(name, options, selectedValue) {
  return `<div class="radio-pill-group">${
    options.map(o => `
      <label class="radio-pill ${selectedValue === o.value ? 'active' : ''}">
        <input type="radio" name="${name}" value="${o.value}" ${selectedValue === o.value ? "checked" : ""}>
        <span>${o.label}</span>
      </label>`).join("")
  }</div>`;
}
