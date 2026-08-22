// Admin Dashboard JavaScript

// Check that the logged in user is an admin
const adminSession = requireRole("admin");

// -------------------- Header --------------------
function initHeader() {
  document.getElementById("sideUserName").textContent = adminSession.name;
  document.getElementById("avatarInitial").textContent = adminSession.name.charAt(0).toUpperCase();
  document.getElementById("todayDate").textContent = todayString();
}

// -------------------- Navigation --------------------
function switchView(viewName) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.querySelectorAll(".side-nav button").forEach((b) => b.classList.remove("active"));
  document.getElementById("view-" + viewName).classList.add("active");
  const navBtn = document.querySelector(`.side-nav button[data-view="${viewName}"]`);
  if (navBtn) navBtn.classList.add("active");
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("scrim").classList.remove("show");
}
document.querySelectorAll(".side-nav button[data-view]").forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view)));
document.querySelectorAll("[data-goto]").forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.goto)));
document.getElementById("menuBtn").addEventListener("click", () => {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("scrim").classList.add("show");
});
document.getElementById("scrim").addEventListener("click", () => {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("scrim").classList.remove("show");
});
document.getElementById("logoutBtn").addEventListener("click", logout);

// -------------------- Theme and Currency --------------------
function initPreferenceControls() {
  const themeToggle = document.getElementById("themeToggle");
  const themeLabel = document.getElementById("themeLabel");
  const currencySelect = document.getElementById("currencySelect");

  function refreshThemeLabel() {
        if (getTheme() === "dark") {
            themeLabel.textContent = "Light";
        }else {
            themeLabel.textContent = "Dark";
        }
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

// -------------------- Add and Remove Users --------------------

// Stores the email of user selected for deletion
let pendingDeleteUserEmail = null;

function adminAddUser({ name, email, password }) {
  if (!name || !email || !password) return { ok: false, message: "Please fill in every field." };
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) return { ok: false, message: "That email address doesn't look right." };
  if (password.length < 4) return { ok: false, message: "Password should be at least 4 characters." };

  const users = getAllUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, message: "An account with that email already exists." };
  }

  // Add new user to users array
  users.push({ name, email, password, role: "user" });
  saveAllUsers(users);
  // Create empty subscription list for new user
  writeJSON(STORAGE_KEYS.SUBS_PREFIX + email, []);
  return { ok: true };
}

// Function to delete a user
function adminDeleteUser(email) {
  const users = getAllUsers().filter((u) => u.email !== email);
  saveAllUsers(users);
  localStorage.removeItem(STORAGE_KEYS.SUBS_PREFIX + email);
  localStorage.removeItem(STORAGE_KEYS.BUDGET_PREFIX + email);
}

const addUserForm = document.getElementById("addUserForm");

// Remove error styles from form
function clearAddUserErrors() {
  ["newUserNameField", "newUserEmailField", "newUserPasswordField"].forEach((id) => document.getElementById(id).classList.remove("error"));
}

// Display message below add user form
function showAddUserMessage(text, type) {
  const el = document.getElementById("addUserMsg");
  el.textContent = text;
  el.className = `form-msg show ${type}`;
}

// When add user form is submitted
addUserForm.addEventListener("submit", function (e) {
  e.preventDefault();  // Prevent page from refreshing
  clearAddUserErrors();

  const name = document.getElementById("newUserName").value.trim();
  const email = document.getElementById("newUserEmail").value.trim();
  const password = document.getElementById("newUserPassword").value;

  const result = adminAddUser({ name, email, password });
  if (!result.ok) {
    if (!name) document.getElementById("newUserNameField").classList.add("error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) document.getElementById("newUserEmailField").classList.add("error");
    if (password.length < 4) document.getElementById("newUserPasswordField").classList.add("error");
    showAddUserMessage(result.message, "error");
    return;
  }

  // User was added successfully
  showAddUserMessage(`${name} added.`, "success");
  addUserForm.reset();  // Clear form
  showToast(`${name} added as a user.`, "success");   // Show success notification
  renderAll();    // Refresh dashboard
});

// Cancel delete button
document.getElementById("cancelDeleteUserBtn").addEventListener("click", () => {
  pendingDeleteUserEmail = null;
  document.getElementById("deleteUserModal").classList.remove("show");
});

// Confirm delete button
document.getElementById("confirmDeleteUserBtn").addEventListener("click", () => {
  if (!pendingDeleteUserEmail) return;
  adminDeleteUser(pendingDeleteUserEmail);
  showToast("User removed.", "success");
  pendingDeleteUserEmail = null;
  document.getElementById("deleteUserModal").classList.remove("show");
  renderAll();
});

// Ask admin before deleting user
function askDeleteUser(email, name) {
  pendingDeleteUserEmail = email;
  document.getElementById("deleteUserModalText").textContent =
    `Remove "${name}" (${email})? This deletes their account and every subscription they've tracked. This can't be undone.`;
  document.getElementById("deleteUserModal").classList.add("show");
}

// -------------------- User Subscription Summary --------------------

// Create summary for every normal user
function buildUserSummaries() {
  const users = getAllUsers().filter((u) => u.role === "user");

  // .map() turns each user into a summary object with totals attached
  return users.map((user) => {
    const subs = readJSON(STORAGE_KEYS.SUBS_PREFIX + user.email, []);
    const monthly = subs.reduce((sum, s) => sum + toMonthly(s.cost, s.billingCycle), 0);
    const annual = subs.reduce((sum, s) => sum + toAnnual(s.cost, s.billingCycle), 0);

    // group by category to find this user's overlaps
    const grouped = subs.reduce((groups, s) => {
      const key = s.category || "Other";
      (groups[key] = groups[key] || []).push(s);
      return groups;
    }, {});
    let leakMonthly = 0;
    for (const category in grouped) {
      const list = grouped[category];
      if (list.length < 2) continue;
      const sorted = [...list].sort((a, b) => toMonthly(a.cost, a.billingCycle) - toMonthly(b.cost, b.billingCycle));
      leakMonthly += sorted.slice(1).reduce((sum, s) => sum + toMonthly(s.cost, s.billingCycle), 0);
    }

    return { ...user, subs, monthly, annual, leakMonthly, leakAnnual: leakMonthly * 12, categoryTotals: grouped };
  });
}

// -------------------- Renewal Date --------------------

// Find next renewal date of a subscription.
function nextRenewalDate(sub) {
  if (!sub.renewalDate) return null;
  const date = new Date(sub.renewalDate + "T00:00:00");
  if (isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let guard = 0;
  while (date < today && guard < 1000) {
    if (sub.billingCycle === "weekly") date.setDate(date.getDate() + 7);
    else if (sub.billingCycle === "yearly") date.setFullYear(date.getFullYear() + 1);
    else date.setMonth(date.getMonth() + 1);
    guard++;
  }
  return date;
}

// -------------------- Render Complete Dashboard --------------------

// Refresh all sections of admin dashboard
function renderAll() {
  const summaries = buildUserSummaries();
  renderStats(summaries);
  renderChart(summaries);
  renderTideGauge(summaries);
  renderTopLeakers(summaries);
  renderUsersTable(summaries);
  renderInsights(summaries);
}

function renderStats(summaries) {
  const totalSubs = summaries.reduce((sum, u) => sum + u.subs.length, 0);
  const totalMonthly = summaries.reduce((sum, u) => sum + u.monthly, 0);
  const totalLeakAnnual = summaries.reduce((sum, u) => sum + u.leakAnnual, 0);

  document.getElementById("statUsers").textContent = summaries.length;
  document.getElementById("statSubs").textContent = totalSubs;
  document.getElementById("statMonthly").textContent = formatCurrency(totalMonthly);
  document.getElementById("statLeak").textContent = formatCurrency(totalLeakAnnual);
}

// -------------------- Dashboard Statistics --------------------

// Display total users, subscriptions and spending
function renderChart(summaries) {
  const area = document.getElementById("chartArea");
  // Merge every user's category totals into one combined object
  const combined = {};

  // Go through every user's summary
  summaries.forEach((u) => {
    Object.keys(u.categoryTotals).forEach((category) => {
      const monthlyForCat = totalMonthlyOf(u.categoryTotals[category]);
      combined[category] = (combined[category] || 0) + monthlyForCat;
    });
  });

  const rows = Object.keys(combined)
    .map((category) => ({ category, amount: combined[category] }))
    .sort((a, b) => b.amount - a.amount);

  if (rows.length === 0) {
    area.innerHTML = `<div class="empty-state"><h4>No data yet</h4><p>Nothing has been tracked by any user.</p></div>`;
    return;
  }
  const max = Math.max(...rows.map((r) => r.amount), 1);
  area.innerHTML = `<div class="bar-chart">${rows
    .map(
      (r) => `<div class="bar-row">
        <div class="cat-name">${r.category}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(r.amount / max) * 100}%"></div></div>
        <div class="cat-amt">${formatCurrency(r.amount)}</div>
      </div>`
    )
    .join("")}</div>`;
}

// Calculate total monthly cost of a subscription list
function totalMonthlyOf(list) {
  return list.reduce((sum, s) => sum + toMonthly(s.cost, s.billingCycle), 0);
}

// Show percentage of monthly spending that may be leaking
function renderTideGauge(summaries) {
  const totalMonthly = summaries.reduce((sum, u) => sum + u.monthly, 0);
  const totalLeakMonthly = summaries.reduce((sum, u) => sum + u.leakMonthly, 0);
  const pct = totalMonthly > 0 ? Math.round((totalLeakMonthly / totalMonthly) * 100) : 0;

  const fill = document.getElementById("tideFill");
  fill.style.height = Math.min(pct, 100) + "%";
  fill.classList.toggle("healthy", pct < 15);
  document.getElementById("tidePct").textContent = pct + "%";
  document.getElementById("tideAmt").textContent = formatCurrency(totalLeakMonthly) + " / mo leaking";
}

// Show users with highest yearly cost leak
function renderTopLeakers(summaries) {
  const area = document.getElementById("topLeakers");
  const ranked = [...summaries].sort((a, b) => b.leakAnnual - a.leakAnnual).filter((u) => u.leakAnnual > 0).slice(0, 5);

  if (ranked.length === 0) {
    area.innerHTML = `<div class="empty-state"><h4>Nobody is leaking right now</h4><p>Every user's subscriptions are in unique categories.</p></div>`;
    return;
  }

  area.innerHTML = ranked
    .map(
      (u) => `
    <div class="overlap-item">
      <div class="overlap-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s-8-4.5-8-11.5A8 8 0 0 1 12 3a8 8 0 0 1 8 7.5C20 17.5 12 22 12 22z"/></svg>
      </div>
      <div style="flex:1;">
        <h4>${u.name}</h4>
        <p>${u.email} · ${u.subs.length} subscriptions tracked</p>
      </div>
      <div class="save">${formatCurrency(u.leakAnnual)}/yr</div>
    </div>`
    )
    .join("");
}

// Display all users inside the users table
function renderUsersTable(summaries) {
  const tbody = document.getElementById("usersTableBody");
  const term = (document.getElementById("userSearch").value || "").trim().toLowerCase();

  const visible = summaries.filter((u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));

  if (visible.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--ink-soft);padding:30px;">No users match "${term}".</td></tr>`;
    return;
  }

  tbody.innerHTML = visible
    .map(
      (u) => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td>${u.subs.length}</td>
      <td>${formatCurrency(u.monthly)}</td>
      <td>${u.leakAnnual > 0 ? `<span class="badge badge-leak">${formatCurrency(u.leakAnnual)}</span>` : `<span class="badge badge-good">${formatCurrency(0)}</span>`}</td>
      <td style="display:flex;gap:6px;">
        <button class="btn-icon" title="View subscriptions" data-view-user="${u.email}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="btn-icon danger" title="Remove user" data-delete-user="${u.email}" data-user-name="${u.name}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg>
        </button>
      </td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-delete-user]").forEach((btn) =>
    btn.addEventListener("click", () => askDeleteUser(btn.dataset.deleteUser, btn.dataset.userName))
  );
  tbody.querySelectorAll("[data-view-user]").forEach((btn) =>
    btn.addEventListener("click", () => openUserDetail(btn.dataset.viewUser))
  );
}

document.getElementById("userSearch").addEventListener("input", () => renderUsersTable(buildUserSummaries()));

// ---- Platform insights: extra info only admins get to see ---- 

// Show important insights from all users
function renderInsights(summaries) {
  const area = document.getElementById("insightsArea");
  const allSubs = summaries.flatMap((u) => u.subs);

  if (allSubs.length === 0) {
    area.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h4>Nothing tracked yet</h4><p>Insights appear once at least one user adds a subscription.</p></div>`;
    return;
  }

  const categoryTotals = {};
  allSubs.forEach((s) => {
    const key = s.category || "Other";
    categoryTotals[key] = (categoryTotals[key] || 0) + toMonthly(s.cost, s.billingCycle);
  });
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const paymentCounts = {};
  allSubs.forEach((s) => {
    if (!s.paymentMethod) return;
    paymentCounts[s.paymentMethod] = (paymentCounts[s.paymentMethod] || 0) + 1;
  });
  const topPayment = Object.entries(paymentCounts).sort((a, b) => b[1] - a[1])[0];

  // Renewals landing within the next 7 days, across every account
  const renewingSoon = allSubs.filter((s) => {
    const next = nextRenewalDate(s);
    if (!next) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((next - today) / 86400000);
    return days >= 0 && days <= 7;
  }).length;

  area.innerHTML = `
    <div class="budget-mini-card">
      <div class="lbl">Top category (spend)</div>
      <div class="val">${topCategory ? topCategory[0] : "—"}</div>
    </div>
    <div class="budget-mini-card">
      <div class="lbl">Most-used payment method</div>
      <div class="val">${topPayment ? `${PAYMENT_ICON_ADMIN[topPayment[0]] || "💰"} ${topPayment[0]}` : "—"}</div>
    </div>
    <div class="budget-mini-card">
      <div class="lbl">Renewing within 7 days</div>
      <div class="val ${renewingSoon > 0 ? "leak" : "good"}">${renewingSoon} subscription${renewingSoon === 1 ? "" : "s"}</div>
    </div>`;
}

const PAYMENT_ICON_ADMIN = {
  GPay: "📲",
  PhonePe: "📲",
  Paytm: "📲",
  "Credit Card": "💳",
  "Debit Card": "💳",
  PayPal: "🅿️",
  Other: "💰",
};

// ---- Per-user drill-down modal ---- 

// Open modal to show subscriptions of one user
function openUserDetail(email) {

  // Find selected user using email
  const u = buildUserSummaries().find((s) => s.email === email);
  if (!u) return;

  document.getElementById("userDetailName").textContent = u.name;
  document.getElementById("userDetailEmail").textContent = u.email;

  const area = document.getElementById("userDetailSubs");
  if (u.subs.length === 0) {
    area.innerHTML = `<div class="empty-state"><h4>No subscriptions</h4><p>This user hasn't tracked anything yet.</p></div>`;
  } else {

    // Create subscription cards
    area.innerHTML = u.subs
      .map((s) => {
        // Find next renewal date
        const next = nextRenewalDate(s);
        const renewLabel = next ? next.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
        return `
        <div class="overlap-item" style="background:transparent;border-color:var(--line);">
          <div style="flex:1;">
            <h4>${s.name} <span style="font-weight:400;color:var(--ink-soft);">— ${s.category}</span></h4>
            <p>${formatCurrency(s.cost)} / ${s.billingCycle} · ${PAYMENT_ICON_ADMIN[s.paymentMethod] || "💰"} ${s.paymentMethod || "—"}${s.cardLast4 ? ` •••• ${s.cardLast4}` : ""} · renews ${renewLabel}</p>
          </div>
        </div>`;
      })
      .join("");
  }
  // Open user details modal
  document.getElementById("userDetailModal").classList.add("show");
}
// Close user details modal
document.getElementById("closeUserDetailBtn").addEventListener("click", () => {
  document.getElementById("userDetailModal").classList.remove("show");
});

// ---- Boot ---- 

// Run functions when admin page starts
initHeader();
initPreferenceControls();
renderAll();
