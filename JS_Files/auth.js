/* ============================================================
   auth.js
   Handles the "database" of users (kept in localStorage), plus
   login / signup / logout / route-guarding.
   Concepts used: arrays & array methods (find, some, filter),
   objects, destructuring, spread, conditions, events, loops.
   ============================================================ */

// ---- 1. Seed some demo data the very first time the app runs ----
// This means the app is never "empty" — a college demo / viva can
// log straight in without creating an account first.
function seedDemoData() {
  const existingUsers = readJSON(STORAGE_KEYS.USERS, null);
  if (existingUsers) return; // already seeded, do nothing

  const demoUsers = [
    { name: "Demo User", email: "user@demo.com", password: "user123", role: "user" },
    { name: "Admin", email: "admin@demo.com", password: "admin123", role: "admin" },
    { name: "Priya Sharma", email: "priya@demo.com", password: "priya123", role: "user" },
    { name: "Rahul Verma", email: "rahul@demo.com", password: "rahul123", role: "user" },
  ];
  writeJSON(STORAGE_KEYS.USERS, demoUsers);

  // Give the main demo user a realistic, slightly leaky subscription list
  const demoSubs = [
    { id: makeId(), name: "Spotify", category: "Music", cost: 119, billingCycle: "monthly", renewalDate: "2026-08-27", paymentMethod: "GPay", cardLast4: "", createdAt: new Date().toISOString() },
    { id: makeId(), name: "Apple Music", category: "Music", cost: 99, billingCycle: "monthly", renewalDate: "2026-09-05", paymentMethod: "Credit Card", cardLast4: "4521", createdAt: new Date().toISOString() },
    { id: makeId(), name: "Netflix", category: "Video", cost: 649, billingCycle: "monthly", renewalDate: "2026-08-22", paymentMethod: "Credit Card", cardLast4: "7788", createdAt: new Date().toISOString() },
    { id: makeId(), name: "Amazon Prime Video", category: "Video", cost: 1499, billingCycle: "yearly", renewalDate: "2026-08-30", paymentMethod: "PhonePe", cardLast4: "", createdAt: new Date().toISOString() },
    { id: makeId(), name: "Google One", category: "Cloud Storage", cost: 130, billingCycle: "monthly", renewalDate: "2026-09-10", paymentMethod: "Debit Card", cardLast4: "2210", createdAt: new Date().toISOString() },
    { id: makeId(), name: "Cult.fit", category: "Fitness", cost: 999, billingCycle: "yearly", renewalDate: "2027-01-15", paymentMethod: "Paytm", cardLast4: "", createdAt: new Date().toISOString() },
  ];
  writeJSON(STORAGE_KEYS.SUBS_PREFIX + "user@demo.com", demoSubs);
  writeJSON(STORAGE_KEYS.BUDGET_PREFIX + "user@demo.com", 3200);

  // Smaller sample sets for the other two demo users so the admin
  // dashboard has more than one row to show.
  writeJSON(STORAGE_KEYS.SUBS_PREFIX + "priya@demo.com", [
    { id: makeId(), name: "YouTube Premium", category: "Video", cost: 149, billingCycle: "monthly", renewalDate: "2026-08-25", paymentMethod: "PhonePe", cardLast4: "", createdAt: new Date().toISOString() },
    { id: makeId(), name: "Notion", category: "Productivity", cost: 8, billingCycle: "monthly", renewalDate: "2026-09-02", paymentMethod: "PayPal", cardLast4: "", createdAt: new Date().toISOString() },
  ]);
  writeJSON(STORAGE_KEYS.SUBS_PREFIX + "rahul@demo.com", [
    { id: makeId(), name: "Hotstar", category: "Video", cost: 1499, billingCycle: "yearly", renewalDate: "2026-09-18", paymentMethod: "Debit Card", cardLast4: "3390", createdAt: new Date().toISOString() },
    { id: makeId(), name: "Jio Cloud", category: "Cloud Storage", cost: 99, billingCycle: "monthly", renewalDate: "2026-08-24", paymentMethod: "GPay", cardLast4: "", createdAt: new Date().toISOString() },
    { id: makeId(), name: "Zomato Gold", category: "Food", cost: 149, billingCycle: "monthly", renewalDate: "2026-08-29", paymentMethod: "Paytm", cardLast4: "", createdAt: new Date().toISOString() },
  ]);
}
seedDemoData();

// ---- 2. Basic user-store helpers ----
function getAllUsers() {
  return readJSON(STORAGE_KEYS.USERS, []);
}

function saveAllUsers(users) {
  writeJSON(STORAGE_KEYS.USERS, users);
}

function findUserByEmail(email) {
  const users = getAllUsers();
  // .find() returns the first matching object, or undefined
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// ---- 3. Session helpers ----
function setSession(user) {
  // Destructuring: pull just the fields we need out of the user object
  const { name, email, role } = user;
  writeJSON(STORAGE_KEYS.SESSION, { name, email, role });
}

function getSession() {
  return readJSON(STORAGE_KEYS.SESSION, null);
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

// Redirects away if nobody is logged in, or if the wrong role is
// trying to view a page (e.g. a normal user opening admin-dashboard.html).
function requireRole(role) {
  const session = getSession();
  if (!session || session.role !== role) {
    window.location.href = role === "admin" ? "admin-login.html" : "login.html";
  }
  return session;
}

// ---- 4. Signup ----
// Returns { ok: true } on success or { ok: false, message } on failure.
function signupUser({ name, email, password }) {
  if (!name || !email || !password) {
    return { ok: false, message: "Please fill in every field." };
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { ok: false, message: "That email address doesn't look right." };
  }
  if (password.length < 4) {
    return { ok: false, message: "Password should be at least 4 characters." };
  }

  const users = getAllUsers();
  const alreadyExists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (alreadyExists) {
    return { ok: false, message: "An account with that email already exists." };
  }

  const newUser = { name, email, password, role: "user" };
  users.push(newUser);
  saveAllUsers(users);
  writeJSON(STORAGE_KEYS.SUBS_PREFIX + email, []); // empty subscription list to start
  setSession(newUser);
  return { ok: true };
}

// ---- 5. Login (shared by user + admin pages, filtered by expectedRole) ----
function loginUser(email, password, expectedRole) {
  if (!email || !password) {
    return { ok: false, message: "Please enter both email and password." };
  }
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return { ok: false, message: "Incorrect email or password." };
  }
  if (user.role !== expectedRole) {
    return {
      ok: false,
      message:
        expectedRole === "admin"
          ? "This account isn't an admin account."
          : "Admins should use the Admin Login page.",
    };
  }
  setSession(user);
  return { ok: true, user };
}

function logout() {
  clearSession();
  window.location.href = "index.html";
}
