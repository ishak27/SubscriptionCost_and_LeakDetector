/* ============================================================
   app.js — the user dashboard
   Concepts used: variables, data types, type conversion,
   operators, conditionals, loops, functions, arrays & array
   methods (map/filter/reduce/find/sort), objects, destructuring,
   DOM manipulation, events, form validation, localStorage,
   ES6 template literals/arrow functions, callbacks, try/catch.
   ============================================================ */

// ---- 0. Guard this page: only logged-in users may see it ----
const session = requireRole("user");

// `subscriptions` is the single source of truth for this page.
// We keep it as a normal array in memory and re-save it to
// localStorage every time it changes.
let subscriptions = [];
let editingId = null; // null = "add mode", otherwise the id being edited
let pendingDeleteId = null;

const storageKey = STORAGE_KEYS.SUBS_PREFIX + session.email;
const budgetKey = STORAGE_KEYS.BUDGET_PREFIX + session.email;

function loadSubscriptions() {
  subscriptions = readJSON(storageKey, []);
}

function saveSubscriptions() {
  writeJSON(storageKey, subscriptions);
}

function loadBudget() {
  return Number(readJSON(budgetKey, 0)) || 0;
}

function saveBudget(amount) {
  writeJSON(budgetKey, amount);
}

// ---- Theme + currency preferences (shared helpers live in utils.js) ----
function initPreferenceControls() {
  const themeToggle = document.getElementById("themeToggle");
  const themeLabel = document.getElementById("themeLabel");
  const currencySelect = document.getElementById("currencySelect");

  function refreshThemeLabel() {
    themeLabel.textContent = getTheme() === "dark" ? "Light" : "Dark";
  }
  refreshThemeLabel();
  themeToggle.addEventListener("click", () => {
    toggleTheme();
    refreshThemeLabel();
  });

  currencySelect.value = getCurrency();
  currencySelect.addEventListener("change", () => {
    setCurrency(currencySelect.value);
    renderAll();
  });
}

// ---- 1. Sidebar / header personalisation ----
function initHeader() {
  document.getElementById("sideUserName").textContent = session.name;
  document.getElementById("avatarInitial").textContent = session.name.charAt(0).toUpperCase();
  document.getElementById("welcomeName").textContent = ", " + session.name.split(" ")[0];
  document.getElementById("todayDate").textContent = todayString();
}

// ---- 2. Navigation between views ----
function switchView(viewName) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.querySelectorAll(".side-nav button").forEach((b) => b.classList.remove("active"));
  document.getElementById("view-" + viewName).classList.add("active");
  const navBtn = document.querySelector(`.side-nav button[data-view="${viewName}"]`);
  if (navBtn) navBtn.classList.add("active");
  // close the mobile sidebar after choosing a view
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("scrim").classList.remove("show");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".side-nav button[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});
document.querySelectorAll("[data-goto]").forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.goto));
});

// Mobile hamburger menu
document.getElementById("menuBtn").addEventListener("click", () => {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("scrim").classList.add("show");
});
document.getElementById("scrim").addEventListener("click", () => {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("scrim").classList.remove("show");
});

document.getElementById("logoutBtn").addEventListener("click", logout);

// ---- 3. Calculation helpers (pure functions — easy to explain in a viva) ----

// Groups subscriptions by category using reduce().
// Returns an object like { Music: [sub, sub], Video: [sub] }
function groupByCategory(list) {
  return list.reduce((groups, sub) => {
    const key = sub.category || "Other";
    if (!groups[key]) groups[key] = []; // first time we see this category
    groups[key].push(sub);
    return groups;
  }, {});
}

// Categories that have 2 or more subscriptions are "overlaps".
// For each overlapping category, the "leak" is every subscription
// except the cheapest one — money you'd save by keeping just one.
function findOverlaps(list) {
  const grouped = groupByCategory(list);
  const overlaps = [];

  // Object.entries + destructuring turns {category: subs[]} into pairs
  for (const [category, subs] of Object.entries(grouped)) {
    if (subs.length < 2) continue; // not an overlap

    // sort a *copy* of the array cheapest-first (by monthly cost)
    const sorted = [...subs].sort((a, b) => toMonthly(a.cost, a.billingCycle) - toMonthly(b.cost, b.billingCycle));
    const keep = sorted[0];
    const leaking = sorted.slice(1); // everything except the cheapest

    const leakMonthly = leaking.reduce((sum, s) => sum + toMonthly(s.cost, s.billingCycle), 0);
    overlaps.push({
      category,
      subs: sorted,
      keep,
      leaking,
      leakMonthly,
      leakAnnual: leakMonthly * 12,
    });
  }

  // Show the biggest leaks first
  overlaps.sort((a, b) => b.leakMonthly - a.leakMonthly);
  return overlaps;
}

function totalMonthly(list) {
  return list.reduce((sum, s) => sum + toMonthly(s.cost, s.billingCycle), 0);
}
function totalAnnual(list) {
  return list.reduce((sum, s) => sum + toAnnual(s.cost, s.billingCycle), 0);
}

// ---- 3b. Renewal date helpers ----

// Rolls a stored "next renewal date" forward using the subscription's
// billing cycle until it lands on today or later. This means a date
// that already passed still shows up as the *next* upcoming renewal,
// instead of silently going stale.
function getNextRenewal(sub) {
  if (!sub.renewalDate) return null;
  const date = new Date(sub.renewalDate + "T00:00:00");
  if (isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let guard = 0; // safety net so a bad cycle value can never loop forever
  while (date < today && guard < 1000) {
    if (sub.billingCycle === "weekly") date.setDate(date.getDate() + 7);
    else if (sub.billingCycle === "yearly") date.setFullYear(date.getFullYear() + 1);
    else date.setMonth(date.getMonth() + 1); // monthly (default)
    guard++;
  }
  return date;
}

// Whole days between today and a given date (can be negative if past)
function daysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date - today) / 86400000);
}

// Traffic-light urgency used by both the ticket badges and the calendar
function renewalUrgency(days) {
  if (days <= 3) return "red";
  if (days <= 10) return "yellow";
  return "green";
}

const URGENCY_DOT = { red: "🔴", yellow: "🟡", green: "🟢" };

const PAYMENT_ICON = {
  GPay: "📲",
  PhonePe: "📲",
  Paytm: "📲",
  "Credit Card": "💳",
  "Debit Card": "💳",
  PayPal: "🅿️",
  Other: "💰",
};

function renewalBadgeHtml(sub) {
  const next = getNextRenewal(sub);
  if (!next) return "";
  const days = daysUntil(next);
  const urgency = renewalUrgency(days);
  const dateLabel = next.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const daysLabel = days === 0 ? "today" : days === 1 ? "in 1 day" : days < 0 ? dateLabel : `in ${days} days`;
  return `<span class="badge badge-renewal ${urgency}">${URGENCY_DOT[urgency]} Renews ${dateLabel} · ${daysLabel}</span>`;
}

function paymentBadgeHtml(sub) {
  if (!sub.paymentMethod) return "";
  const icon = PAYMENT_ICON[sub.paymentMethod] || "💰";
  const cardBit = sub.cardLast4 ? ` •••• ${sub.cardLast4}` : "";
  return `<span class="badge badge-sand">${icon} ${sub.paymentMethod}${cardBit}</span>`;
}

// ---- 4. Rendering ----

function renderAll() {
  renderStats();
  renderChart();
  renderTideGauge();
  renderQuickOverlaps();
  renderSubList();
  renderCategoryFilterOptions();
  renderOverlapDetail();
  renderReportTable();
  renderBudget();
  renderBudgetCategory();
  renderCalendar();
  renderUpcomingRenewals();
}

function renderStats() {
  const monthly = totalMonthly(subscriptions);
  const annual = totalAnnual(subscriptions);
  const overlaps = findOverlaps(subscriptions);
  const annualLeak = overlaps.reduce((sum, o) => sum + o.leakAnnual, 0);
  const categories = Object.keys(groupByCategory(subscriptions));

  document.getElementById("statCount").textContent = subscriptions.length;
  document.getElementById("statCountSub").textContent = `across ${categories.length} categor${categories.length === 1 ? "y" : "ies"}`;
  document.getElementById("statMonthly").textContent = formatCurrency(monthly);
  document.getElementById("statAnnual").textContent = formatCurrency(annual);
  document.getElementById("statLeak").textContent = formatCurrency(annualLeak);
  document.getElementById("statLeakSub").textContent =
    overlaps.length > 0 ? `from ${overlaps.length} overlapping categor${overlaps.length === 1 ? "y" : "ies"}` : "no overlaps found 🎉";
}

function renderChart() {
  const area = document.getElementById("chartArea");
  if (subscriptions.length === 0) {
    area.innerHTML = emptyStateHtml("No subscriptions yet", "Add one to see your spend breakdown.");
    return;
  }
  const grouped = groupByCategory(subscriptions);
  // Build [{category, amount}] then sort largest first
  const rows = Object.keys(grouped)
    .map((category) => ({ category, amount: totalMonthly(grouped[category]) }))
    .sort((a, b) => b.amount - a.amount);
  const max = Math.max(...rows.map((r) => r.amount), 1);

  area.innerHTML = `<div class="bar-chart">${rows
    .map(
      (r) => `
      <div class="bar-row">
        <div class="cat-name">${r.category}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(r.amount / max) * 100}%"></div></div>
        <div class="cat-amt">${formatCurrency(r.amount)}</div>
      </div>`
    )
    .join("")}</div>`;
}

function renderTideGauge() {
  const monthly = totalMonthly(subscriptions);
  const overlaps = findOverlaps(subscriptions);
  const leakMonthly = overlaps.reduce((sum, o) => sum + o.leakMonthly, 0);
  const pct = monthly > 0 ? Math.round((leakMonthly / monthly) * 100) : 0;

  const fill = document.getElementById("tideFill");
  fill.style.height = Math.min(pct, 100) + "%";
  fill.classList.toggle("healthy", pct < 15); // green tide when leak is small
  document.getElementById("tidePct").textContent = pct + "%";
  document.getElementById("tideAmt").textContent = formatCurrency(leakMonthly) + " / mo leaking";
}

function renderQuickOverlaps() {
  const area = document.getElementById("quickOverlaps");
  const overlaps = findOverlaps(subscriptions).slice(0, 3); // top 3 only
  if (overlaps.length === 0) {
    area.innerHTML = emptyStateHtml("No overlaps detected", "Every category currently has just one subscription. Nice and tidy.");
    return;
  }
  area.innerHTML = overlaps.map(overlapItemHtml).join("");
}

function renderOverlapDetail() {
  const area = document.getElementById("overlapDetailArea");
  const overlaps = findOverlaps(subscriptions);
  if (overlaps.length === 0) {
    area.innerHTML = emptyStateHtml("Nothing leaking right now", "As soon as two subscriptions share a category, they'll show up here with a savings estimate.");
    return;
  }
  area.innerHTML = overlaps.map(overlapItemHtml).join("");
}

function overlapItemHtml(o) {
  const names = o.leaking.map((s) => s.name).join(", ");
  return `
    <div class="overlap-item">
      <div class="overlap-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s-8-4.5-8-11.5A8 8 0 0 1 12 3a8 8 0 0 1 8 7.5C20 17.5 12 22 12 22z"/></svg>
      </div>
      <div style="flex:1;">
        <h4>${o.category} — ${o.subs.length} subscriptions overlapping</h4>
        <p>You're keeping <strong>${o.keep.name}</strong> as the cheapest. Cancelling <strong>${names}</strong> would save <span class="save">${formatCurrency(o.leakMonthly)}/mo</span> — that's <span class="save">${formatCurrency(o.leakAnnual)}/yr</span>.</p>
      </div>
    </div>`;
}

function renderCategoryFilterOptions() {
  const select = document.getElementById("categoryFilter");
  const current = select.value;
  const categories = Object.keys(groupByCategory(subscriptions)).sort();
  select.innerHTML =
    `<option value="all">All categories</option>` + categories.map((c) => `<option value="${c}">${c}</option>`).join("");
  // keep whatever the user had selected, if it still exists
  if ([...select.options].some((o) => o.value === current)) select.value = current;
}

function renderSubList() {
  const area = document.getElementById("subListArea");
  const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();
  const categoryFilter = document.getElementById("categoryFilter").value;

  // Combine search + category filter using array .filter()
  const visible = subscriptions.filter((sub) => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm);
    const matchesCategory = categoryFilter === "all" || sub.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (subscriptions.length === 0) {
    area.innerHTML = emptyStateHtml("No subscriptions yet", "Use the form on the right to add your first one.");
    return;
  }
  if (visible.length === 0) {
    area.innerHTML = emptyStateHtml("No matches", "Try a different search term or category filter.");
    return;
  }

  const overlappingCategories = new Set(findOverlaps(subscriptions).map((o) => o.category));

  area.innerHTML = `<div class="sub-list">${visible
    .map((sub) => {
      const monthly = toMonthly(sub.cost, sub.billingCycle);
      const isOverlap = overlappingCategories.has(sub.category);
      return `
      <div class="ticket">
        <div class="ticket-top">
          <div>
            <div class="ticket-name">${sub.name}</div>
            <div class="ticket-cat">${sub.category}</div>
          </div>
          ${isOverlap ? '<span class="badge badge-leak">Overlap</span>' : '<span class="badge badge-good">Unique</span>'}
        </div>
        <div class="perf"></div>
        <div class="ticket-cost">${formatCurrency(sub.cost)} <span>/ ${sub.billingCycle}</span></div>
        <div class="ticket-badges">
          ${renewalBadgeHtml(sub)}
          ${paymentBadgeHtml(sub)}
        </div>
        <div class="ticket-meta">
          <span class="badge badge-sand">≈ ${formatCurrency(monthly)}/mo</span>
          <div class="ticket-actions">
            <button class="btn-icon" title="Edit" data-edit="${sub.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="btn-icon danger" title="Delete" data-delete="${sub.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg>
            </button>
          </div>
        </div>
      </div>`;
    })
    .join("")}</div>`;

  // Wire up the edit / delete buttons we just created
  area.querySelectorAll("[data-edit]").forEach((btn) => btn.addEventListener("click", () => startEdit(btn.dataset.edit)));
  area.querySelectorAll("[data-delete]").forEach((btn) => btn.addEventListener("click", () => askDelete(btn.dataset.delete)));
}

function renderReportTable() {
  const tbody = document.getElementById("reportTableBody");
  const grouped = groupByCategory(subscriptions);
  const categories = Object.keys(grouped);

  if (categories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--ink-soft); padding:30px;">No data yet — add a subscription to populate this report.</td></tr>`;
    return;
  }

  tbody.innerHTML = categories
    .sort()
    .map((category) => {
      const list = grouped[category];
      const monthly = totalMonthly(list);
      const annual = totalAnnual(list);
      const isOverlap = list.length > 1;
      return `
      <tr>
        <td><strong>${category}</strong></td>
        <td>${list.length}</td>
        <td>${formatCurrency(monthly)}</td>
        <td>${formatCurrency(annual)}</td>
        <td>${isOverlap ? '<span class="badge badge-leak">Overlap</span>' : '<span class="badge badge-good">Healthy</span>'}</td>
      </tr>`;
    })
    .join("");
}

// ---- Budget planner ----
function renderBudget() {
  const area = document.getElementById("budgetArea");
  const budget = loadBudget();
  document.getElementById("budgetInput").value = budget || "";

  if (!budget) {
    area.innerHTML = `<div class="budget-no-cap">Set a monthly budget above to see how your subscriptions compare to it.</div>`;
    return;
  }

  const monthly = totalMonthly(subscriptions);
  const remaining = budget - monthly;
  const pct = Math.min(Math.round((monthly / budget) * 100), 999);

  let fillClass = "";
  if (pct >= 100) fillClass = "over";
  else if (pct >= 80) fillClass = "warn";

  area.innerHTML = `
    <div class="budget-summary-grid">
      <div class="budget-mini-card">
        <div class="lbl">Monthly budget</div>
        <div class="val">${formatCurrency(budget)}</div>
      </div>
      <div class="budget-mini-card">
        <div class="lbl">Currently spending</div>
        <div class="val">${formatCurrency(monthly)}</div>
      </div>
      <div class="budget-mini-card">
        <div class="lbl">${remaining >= 0 ? "Remaining" : "Over budget by"}</div>
        <div class="val ${remaining >= 0 ? "good" : "leak"}">${formatCurrency(Math.abs(remaining))}</div>
      </div>
    </div>
    <div class="budget-progress-wrap">
      <div class="budget-progress-track">
        <div class="budget-progress-fill ${fillClass}" style="width:${Math.min(pct, 100)}%;"></div>
      </div>
      <div class="budget-progress-caption">
        <span>${pct}% of budget used</span>
        <span>${pct >= 100 ? "⚠️ Over budget — time to trim something" : pct >= 80 ? "Getting close to the cap" : "Comfortably within budget"}</span>
      </div>
    </div>`;
}

function renderBudgetCategory() {
  const area = document.getElementById("budgetCategoryArea");
  const budget = loadBudget();

  if (subscriptions.length === 0) {
    area.innerHTML = emptyStateHtml("Nothing to plan yet", "Add a subscription to see a category-by-category budget split.");
    return;
  }
  if (!budget) {
    area.innerHTML = `<div class="budget-no-cap">Set a monthly budget to see how each category shares it.</div>`;
    return;
  }

  const grouped = groupByCategory(subscriptions);
  const rows = Object.keys(grouped)
    .map((category) => ({ category, amount: totalMonthly(grouped[category]) }))
    .sort((a, b) => b.amount - a.amount);

  area.innerHTML = `<div class="bar-chart">${rows
    .map((r) => {
      const share = Math.min(Math.round((r.amount / budget) * 100), 100);
      return `
      <div class="bar-row">
        <div class="cat-name">${r.category}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${share}%"></div></div>
        <div class="cat-amt">${share}%</div>
      </div>`;
    })
    .join("")}</div>`;
}

document.getElementById("budgetForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const input = document.getElementById("budgetInput");
  const value = Number(input.value);

  document.getElementById("budgetField").classList.toggle("error", !value || value <= 0);
  if (!value || value <= 0) {
    showToast("Enter a budget greater than 0.", "error");
    return;
  }

  saveBudget(value);
  document.getElementById("budgetField").classList.remove("error");
  renderBudget();
  renderBudgetCategory();
  showToast("Budget saved.", "success");
});

// ---- Renewal calendar ----
// Tracks which month is currently on screen; starts on today's month.
let calendarCursor = new Date();
calendarCursor.setDate(1);

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();

  document.getElementById("calMonthLabel").textContent = calendarCursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Group each subscription's *next* renewal by the day-of-month it
  // falls on, but only for renewals landing in the month on screen.
  const byDay = {};
  subscriptions.forEach((sub) => {
    const next = getNextRenewal(sub);
    if (!next || next.getFullYear() !== year || next.getMonth() !== month) return;
    const day = next.getDate();
    (byDay[day] = byDay[day] || []).push({ sub, urgency: renewalUrgency(daysUntil(next)) });
  });

  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  let cells = "";
  for (let i = 0; i < firstWeekday; i++) cells += `<div class="cal-cell empty"></div>`;

  for (let day = 1; day <= daysInMonth; day++) {
    const entries = byDay[day] || [];
    const isToday = isCurrentMonth && today.getDate() === day;
    const dots = entries
      .map((e) => `<div class="cal-entry" title="${e.sub.name}">${URGENCY_DOT[e.urgency]} <span>${e.sub.name}</span></div>`)
      .join("");
    cells += `
      <div class="cal-cell${isToday ? " today" : ""}${entries.length ? " has-events" : ""}">
        <div class="cal-daynum">${day}</div>
        <div class="cal-entries">${dots}</div>
      </div>`;
  }

  grid.innerHTML = cells;
}

function renderUpcomingRenewals() {
  const area = document.getElementById("upcomingRenewalsArea");
  const withDates = subscriptions
    .map((sub) => ({ sub, next: getNextRenewal(sub) }))
    .filter((e) => e.next)
    .sort((a, b) => a.next - b.next);

  if (withDates.length === 0) {
    area.innerHTML = emptyStateHtml("No renewal dates yet", "Add a renewal date to your subscriptions to see them lined up here.");
    return;
  }

  area.innerHTML = withDates
    .map(({ sub, next }) => {
      const days = daysUntil(next);
      const urgency = renewalUrgency(days);
      const dateLabel = next.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const daysLabel = days === 0 ? "Renews today" : days === 1 ? "Renews in 1 day" : `Renews in ${days} days`;
      return `
      <div class="overlap-item" style="background:transparent;border-color:var(--line);">
        <div class="overlap-icon" style="background:${urgency === "red" ? "var(--leak)" : urgency === "yellow" ? "var(--gold)" : "var(--good)"};">${URGENCY_DOT[urgency]}</div>
        <div style="flex:1;">
          <h4>${sub.name} — ${dateLabel}</h4>
          <p>${daysLabel} · ${sub.category} · ${formatCurrency(sub.cost)} / ${sub.billingCycle}</p>
        </div>
      </div>`;
    })
    .join("");
}

document.getElementById("calPrevBtn").addEventListener("click", () => {
  calendarCursor.setMonth(calendarCursor.getMonth() - 1);
  renderCalendar();
});
document.getElementById("calNextBtn").addEventListener("click", () => {
  calendarCursor.setMonth(calendarCursor.getMonth() + 1);
  renderCalendar();
});

function emptyStateHtml(title, sub) {
  return `<div class="empty-state">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s-8-4.5-8-11.5A8 8 0 0 1 12 3a8 8 0 0 1 8 7.5C20 17.5 12 22 12 22z"/></svg>
    <h4>${title}</h4><p>${sub}</p>
  </div>`;
}

// ---- 5. Form: add + edit share the same <form id="subForm"> ----
const subForm = document.getElementById("subForm");

function clearFieldErrors() {
  ["nameField", "categoryField", "costField", "cycleField", "renewalField", "paymentMethodField", "cardLast4Field"].forEach((id) =>
    document.getElementById(id).classList.remove("error")
  );
}

// Card-last-4 field only makes sense (and is only required) when the
// chosen payment method is actually a card.
const paymentMethodSelect = document.getElementById("subPaymentMethod");
const cardLast4Field = document.getElementById("cardLast4Field");
function syncCardFieldVisibility() {
  const isCard = paymentMethodSelect.value === "Credit Card" || paymentMethodSelect.value === "Debit Card";
  cardLast4Field.style.display = isCard ? "" : "none";
  if (!isCard) document.getElementById("subCardLast4").value = "";
}
paymentMethodSelect.addEventListener("change", syncCardFieldVisibility);

function validateSubForm({ name, category, cost, cycle, renewalDate, paymentMethod, cardLast4 }) {
  clearFieldErrors();
  let valid = true;

  if (!name) {
    document.getElementById("nameField").classList.add("error");
    valid = false;
  }
  if (!category) {
    document.getElementById("categoryField").classList.add("error");
    valid = false;
  }
  // type conversion: cost arrives from the input as a string
  if (!cost || isNaN(cost) || Number(cost) <= 0) {
    document.getElementById("costField").classList.add("error");
    valid = false;
  }
  if (!cycle) {
    document.getElementById("cycleField").classList.add("error");
    valid = false;
  }
  if (!renewalDate) {
    document.getElementById("renewalField").classList.add("error");
    valid = false;
  }
  if (!paymentMethod) {
    document.getElementById("paymentMethodField").classList.add("error");
    valid = false;
  }
  const isCard = paymentMethod === "Credit Card" || paymentMethod === "Debit Card";
  if (isCard && cardLast4 && !/^\d{4}$/.test(cardLast4)) {
    document.getElementById("cardLast4Field").classList.add("error");
    valid = false;
  }
  return valid;
}

subForm.addEventListener("submit", function (e) {
  e.preventDefault();

  // Destructure the raw values straight off the inputs
  const name = document.getElementById("subName").value.trim();
  const category = document.getElementById("subCategory").value;
  const cost = document.getElementById("subCost").value;
  const cycle = document.getElementById("subCycle").value;
  const renewalDate = document.getElementById("subRenewal").value;
  const paymentMethod = document.getElementById("subPaymentMethod").value;
  const cardLast4 = document.getElementById("subCardLast4").value.trim();

  const details = { name, category, cost, cycle, renewalDate, paymentMethod, cardLast4 };
  if (!validateSubForm(details)) {
    showToast("Please fix the highlighted fields.", "error");
    return;
  }

  if (editingId) {
    // Edits just save straight away — no need to "re-pay" for a change.
    commitSubscription(details);
  } else {
    // New subscriptions go through the mock pay-to-confirm flow first;
    // commitSubscription() only runs once the fake PIN step succeeds.
    openPaymentModal(details);
  }
});

function commitSubscription({ name, category, cost, cycle, renewalDate, paymentMethod, cardLast4 }) {
  try {
    if (editingId) {
      // Update: find the matching object and replace its fields
      const target = subscriptions.find((s) => s.id === editingId);
      if (target) {
        target.name = name;
        target.category = category;
        target.cost = Number(cost);
        target.billingCycle = cycle;
        target.renewalDate = renewalDate;
        target.paymentMethod = paymentMethod;
        target.cardLast4 = cardLast4;
      }
      showToast(`${name} updated.`, "success");
    } else {
      // Add: push a brand-new subscription object
      subscriptions.push({
        id: makeId(),
        name,
        category,
        cost: Number(cost),
        billingCycle: cycle,
        renewalDate,
        paymentMethod,
        cardLast4,
        createdAt: new Date().toISOString(),
      });
      showToast(`${name} added.`, "success");
    }

    saveSubscriptions();
    resetForm();
    renderAll();
  } catch (err) {
    // Defensive error handling in case localStorage ever fails (e.g. quota)
    console.error(err);
    showToast("Something went wrong saving that subscription.", "error");
  }
}

// ---- Mock "pay to confirm" flow: PIN → processing → success ----
let pendingPaymentDetails = null;

function openPaymentModal(details) {
  pendingPaymentDetails = details;
  const cost = formatCurrency(Number(details.cost));

  document.getElementById("paymentStepPinText").textContent =
    `Enter your PIN to confirm ${cost} to ${details.name} via ${details.paymentMethod}.`;
  document.getElementById("paymentPinInput").value = "";
  document.getElementById("paymentPinError").style.display = "none";
  document.getElementById("paymentStepPin").style.display = "";
  document.getElementById("paymentStepProcessing").style.display = "none";
  document.getElementById("paymentStepSuccess").style.display = "none";
  document.getElementById("paymentModal").classList.add("show");
  document.getElementById("paymentPinInput").focus();
}

function closePaymentModal() {
  document.getElementById("paymentModal").classList.remove("show");
  pendingPaymentDetails = null;
}

document.getElementById("paymentCancelBtn").addEventListener("click", closePaymentModal);

document.getElementById("paymentPayBtn").addEventListener("click", () => {
  const pin = document.getElementById("paymentPinInput").value.trim();
  const pinError = document.getElementById("paymentPinError");

  if (!/^\d{4,6}$/.test(pin)) {
    pinError.style.display = "block";
    return;
  }
  pinError.style.display = "none";

  // Step 1: PIN accepted → show a brief "processing" state
  document.getElementById("paymentStepPin").style.display = "none";
  document.getElementById("paymentStepProcessing").style.display = "";

  setTimeout(() => {
    // Step 2: "success" — this is a UI simulation only, nothing is
    // actually charged; it just makes the demo feel real.
    const details = pendingPaymentDetails;
    document.getElementById("paymentStepProcessing").style.display = "none";
    document.getElementById("paymentStepSuccess").style.display = "";
    document.getElementById("paymentStepSuccessText").textContent =
      `${formatCurrency(Number(details.cost))} paid to ${details.name} via ${details.paymentMethod}.`;

    setTimeout(() => {
      closePaymentModal();
      commitSubscription(details);
    }, 1100);
  }, 900);
});

// Allow pressing Enter inside the PIN box to submit it
document.getElementById("paymentPinInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("paymentPayBtn").click();
  }
});

function startEdit(id) {
  const sub = subscriptions.find((s) => s.id === id);
  if (!sub) return;
  editingId = id;

  document.getElementById("subId").value = sub.id;
  document.getElementById("subName").value = sub.name;
  document.getElementById("subCategory").value = sub.category;
  document.getElementById("subCost").value = sub.cost;
  document.getElementById("subCycle").value = sub.billingCycle;
  document.getElementById("subRenewal").value = sub.renewalDate || "";
  document.getElementById("subPaymentMethod").value = sub.paymentMethod || "";
  syncCardFieldVisibility();
  document.getElementById("subCardLast4").value = sub.cardLast4 || "";

  document.getElementById("formTitle").textContent = "Edit subscription";
  document.getElementById("submitBtn").textContent = "Save changes";
  document.getElementById("cancelEditBtn").style.display = "inline-flex";

  switchView("manage");
  document.getElementById("subName").focus();
}

document.getElementById("cancelEditBtn").addEventListener("click", resetForm);

function resetForm() {
  editingId = null;
  subForm.reset();
  clearFieldErrors();
  syncCardFieldVisibility();
  document.getElementById("subId").value = "";
  document.getElementById("formTitle").textContent = "Add a subscription";
  document.getElementById("submitBtn").textContent = "Add subscription";
  document.getElementById("cancelEditBtn").style.display = "none";
}

// ---- 6. Delete with confirmation modal ----
function askDelete(id) {
  const sub = subscriptions.find((s) => s.id === id);
  if (!sub) return;
  pendingDeleteId = id;
  document.getElementById("deleteModalText").textContent = `Remove "${sub.name}" from your subscriptions? This can't be undone.`;
  document.getElementById("deleteModal").classList.add("show");
}

document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
  pendingDeleteId = null;
  document.getElementById("deleteModal").classList.remove("show");
});

document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
  if (!pendingDeleteId) return;
  const removed = subscriptions.find((s) => s.id === pendingDeleteId);
  // array method: keep everything that does NOT match the deleted id
  subscriptions = subscriptions.filter((s) => s.id !== pendingDeleteId);
  saveSubscriptions();
  if (editingId === pendingDeleteId) resetForm();
  pendingDeleteId = null;
  document.getElementById("deleteModal").classList.remove("show");
  renderAll();
  showToast(`${removed ? removed.name : "Subscription"} removed.`, "success");
});

// ---- 7. Search + filter listeners ----
document.getElementById("searchInput").addEventListener("input", renderSubList);
document.getElementById("categoryFilter").addEventListener("change", renderSubList);

// ---- 8. Boot the page ----
loadSubscriptions();
initHeader();
initPreferenceControls();
renderAll();
