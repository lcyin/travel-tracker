import { getToken, clearTokens, getUser } from './api.js';

export function requireAuth() {
  if (!getToken()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

export function logout() {
  clearTokens();
  window.location.href = '/login.html';
}

export function renderNav(currentPage) {
  const user = getUser();
  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.innerHTML = `
    <a href="/trips.html" class="navbar-brand">✈ Travel Tracker</a>
    <div class="navbar-links">
      <a href="/trips.html" class="${currentPage === 'trips' ? 'active' : ''}">My Trips</a>
      ${user ? `<span class="navbar-user">${user.displayName || user.email}</span>` : ''}
      <a href="#" id="logout-link">Logout</a>
    </div>
  `;
  document.body.prepend(nav);
  document.getElementById('logout-link').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

export function renderBreadcrumb(container, crumbs) {
  const el = document.createElement('div');
  el.className = 'breadcrumb';
  el.innerHTML = crumbs
    .map((c, i) => {
      if (i === crumbs.length - 1) return `<strong>${c.label}</strong>`;
      return `<a href="${c.href}">${c.label}</a><span>›</span>`;
    })
    .join(' ');
  container.prepend(el);
}
