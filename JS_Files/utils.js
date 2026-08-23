const STORAGE_KEYS = {
  USERS: "cove_users",
  SESSION: "cove_session",
  SUBS_PREFIX: "cove_subs_", 
  BUDGET_PREFIX: "cove_budget_", 
  THEME: "cove_theme",
  CURRENCY: "cove_currency",
};

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


function formatCurrency(amount) {
  
  const value = Number(amount) || 0;
  const info = CURRENCIES[getCurrency()];
  const converted = value * info.rate;
  return info.symbol + converted.toLocaleString(info.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


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


applyTheme(getTheme());


function toMonthly(cost, cycle) {
  const amount = Number(cost) || 0;
  if (cycle === "weekly") return amount * 4.33; 
  if (cycle === "yearly") return amount / 12;
  return amount; 
}

function toAnnual(cost, cycle) {
  const amount = Number(cost) || 0;
  if (cycle === "weekly") return amount * 52;
  if (cycle === "yearly") return amount;
  return amount * 12; 
}


function capitalize(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1);
}


function todayString() {
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return new Date().toLocaleDateString("en-US", options);
}


function makeId() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error("Could not read " + key + " from storage:", err);
    return fallback;
  }
}


function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error("Could not save " + key + " to storage:", err);
    return false;
  }
}


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


  setTimeout(() => {
    toast.classList.add("out");
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}


function waveSvg(extraClass = "") {
  return `<svg class="tide-wave ${extraClass}" viewBox="0 0 200 20" preserveAspectRatio="none">
    <path d="M0 10 Q 12.5 0 25 10 T 50 10 T 75 10 T 100 10 T 125 10 T 150 10 T 175 10 T 200 10 V20 H0 Z"></path>
  </svg>`;
}
