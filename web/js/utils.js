export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateRange(start, end) {
  if (!start && !end) return '—';
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount, currency) {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  } catch {
    return `${Number(amount).toFixed(2)} ${currency || ''}`;
  }
}

export function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

export function statusBadge(status) {
  const map = {
    planning: 'badge-primary',
    ongoing: 'badge-warning',
    completed: 'badge-success',
    planned: 'badge-primary',
    active: 'badge-warning',
    cancelled: 'badge-gray',
  };
  return `<span class="badge ${map[status?.toLowerCase()] || 'badge-gray'}">${status || 'Unknown'}</span>`;
}

export function categoryLabel(cat) {
  const map = {
    food: '🍽 Food',
    transport: '🚗 Transport',
    accommodation: '🏨 Accommodation',
    shopping: '🛍 Shopping',
    tickets_activities: '🎫 Activities',
    cash: '💵 Cash',
    other: '📦 Other',
    sightseeing: '📸 Sightseeing',
    activity: '🎯 Activity',
    meal: '🍽 Meal',
    notes: '📝 Notes',
  };
  return map[cat?.toLowerCase()] || cat || '—';
}

export function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export function showAlert(container, message, type = 'danger') {
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  div.textContent = message;
  container.prepend(div);
  setTimeout(() => div.remove(), 5000);
}

export function renderProgress(packed, total) {
  const pct = total > 0 ? Math.round((packed / total) * 100) : 0;
  let cls = '';
  if (pct === 100) cls = 'success';
  else if (pct >= 50) cls = '';
  else cls = 'warning';
  return `
    <div class="progress"><div class="progress-bar ${cls}" style="width:${pct}%"></div></div>
    <div class="progress-text">${packed}/${total} (${pct}%)</div>
  `;
}

export function confirm(message) {
  return window.confirm(message);
}

export function emptyState(icon, text) {
  return `<div class="empty-state"><div class="empty-state-icon">${icon}</div><div class="empty-state-text">${text}</div></div>`;
}

export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
