/* ============================================================
   utils.js
   Small, reusable helper functions shared by every page.
   Concepts used here: functions, arrow functions, template
   literals, default parameters, ternary operator, array methods.
   ============================================================ */

// Keys we use to store data in localStorage — kept in one place
// so we never mistype a key name anywhere else in the app.
const STORAGE_KEYS = {
  USERS: "cove_users",
  SESSION: "cove_session",
  SUBS_PREFIX: "cove_subs_", // full key becomes cove_subs_<email>
  BUDGET_PREFIX: "cove_budget_", // full key becomes cove_budget_<email>
  THEME: "cove_theme",
  CURRENCY: "cove_currency",
};

// ---- Currency support ----
// All costs are entered/stored in INR (the app's base unit). The
// currency picker only changes how numbers are *displayed*, using
// approximate fixed conversion rates — good enough for a demo.
const CURRENCIES = {
  INR: { symbol: "₹", rate: 1, locale: "en-IN" },
  USD: { symbol: "$", rate: 0.012, locale: "en-US" },
  EUR: { symbol: "€", rate: 0.011, locale: "de-DE" },
  GBP: { symbol: "£", rate: 0.0095, locale: "en-GB" },
};

function getCurrency() {
  const code = localStorage.getItem(STORAGE_KEYS.CURRENCY);
  return CURRENCIES[code] ? code : "INR";
}

function setCurrency(code) {
  if (!CURRENCIES[code]) return;
  localStorage.setItem(STORAGE_KEYS.CURRENCY, code);
}

// Turns a plain number (assumed to be in INR) into a nice currency
// string in whichever currency the user has picked, e.g. 1234.5 -> "₹1,234.50"
function formatCurrency(amount) {
  // Number() performs type conversion in case a string sneaks in
  const value = Number(amount) || 0;
  const info = CURRENCIES[getCurrency()];
  const converted = value * info.rate;
  return info.symbol + converted.toLocaleString(info.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---- Dark mode support ----
function getTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

function toggleTheme() {
  applyTheme(getTheme() === "dark" ? "light" : "dark");
}

// Apply the saved theme immediately on every page (before the body
// even renders content) so there's no light-mode flash.
applyTheme(getTheme());

// Converts any billing cycle into its monthly equivalent cost
function toMonthly(cost, cycle) {
  const amount = Number(cost) || 0;
  if (cycle === "weekly") return amount * 4.33; // ~4.33 weeks per month
  if (cycle === "yearly") return amount / 12;
  return amount; // already monthly
}

// Converts any billing cycle into its yearly (annualized) equivalent cost
function toAnnual(cost, cycle) {
  const amount = Number(cost) || 0;
  if (cycle === "weekly") return amount * 52;
  if (cycle === "yearly") return amount;
  return amount * 12; // monthly
}

// Capitalizes the first letter of a word — used for category / cycle labels
function capitalize(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Formats today's date as a friendly string for topbar headers
function todayString() {
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return new Date().toLocaleDateString("en-US", options);
}

// Generates a reasonably unique id using the current timestamp + random suffix
function makeId() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

// Safe JSON read from localStorage. Returns fallback on any error
// (bad JSON, missing key, etc.) — demonstrates try/catch error handling.
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error("Could not read " + key + " from storage:", err);
    return fallback;
  }
}

// Safe JSON write to localStorage.
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error("Could not save " + key + " to storage:", err);
    return false;
  }
}

// Shows a small toast notification in the bottom-right corner.
// type can be "success", "error", or left blank for neutral.
function showToast(message, type = "") {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`.trim();
  toast.textContent = message;
  wrap.appendChild(toast);

  // Remove the toast automatically after a few seconds
  setTimeout(() => {
    toast.classList.add("out");
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// Small helper to build the wave SVG markup used by the tide gauge,
// so we don't repeat the same path string everywhere.
function waveSvg(extraClass = "") {
  return `<svg class="tide-wave ${extraClass}" viewBox="0 0 200 20" preserveAspectRatio="none">
    <path d="M0 10 Q 12.5 0 25 10 T 50 10 T 75 10 T 100 10 T 125 10 T 150 10 T 175 10 T 200 10 V20 H0 Z"></path>
  </svg>`;
}
