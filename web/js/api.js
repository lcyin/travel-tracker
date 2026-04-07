const API_BASE = window.location.origin;

function getToken() {
  return localStorage.getItem('accessToken');
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

function setTokens(access, refresh) {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

async function refreshAccessToken() {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && token) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      res = await fetch(url, { ...options, headers });
    } else {
      clearTokens();
      window.location.href = '/login.html';
      throw new Error('Session expired');
    }
  }

  return res;
}

async function apiJson(path, options = {}) {
  const res = await api(path, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.json();
}

export {
  API_BASE,
  api,
  apiJson,
  clearTokens,
  getRefreshToken,
  getToken,
  getUser,
  refreshAccessToken,
  setTokens,
  setUser,
};
