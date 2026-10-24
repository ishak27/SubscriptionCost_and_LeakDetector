// Authentication now uses the Express API. Only the short-lived JWT and
// non-sensitive profile details are kept in browser storage.
function setSession(user, token) {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  }));
  localStorage.setItem(TOKEN_KEY, token);
}

function getSession() {
  return readJSON(STORAGE_KEYS.SESSION, null);
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  localStorage.removeItem(TOKEN_KEY);
}

function requireRole(role) {
  const session = getSession();
  const token = localStorage.getItem(TOKEN_KEY);
  if (!session || !token || session.role !== role) {
    window.location.href = role === 'admin' ? 'admin-login.html' : 'login.html';
    return null;
  }
  return session;
}

async function signupUser({ name, email, password }) {
  if (!name || !email || !password) return { ok: false, message: 'Please fill in every field.' };
  try {
    const result = await apiRequest('/auth/register', {
      method: 'POST', body: JSON.stringify({ name, email, password })
    });
    setSession(result.user, result.token);
    return { ok: true, user: result.user };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

async function loginUser(email, password, expectedRole) {
  if (!email || !password) return { ok: false, message: 'Please enter both email and password.' };
  try {
    const result = await apiRequest('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password, expectedRole })
    });
    setSession(result.user, result.token);
    return { ok: true, user: result.user };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

async function verifySession() {
  const session = getSession();
  const token = localStorage.getItem(TOKEN_KEY);
  if (!session || !token) return null;
  try {
    const result = await apiRequest('/auth/me');
    setSession(result.user, token);
    return result.user;
  } catch (_error) {
    clearSession();
    return null;
  }
}

function logout() {
  clearSession();
  window.location.href = 'index.html';
}
