const BASE = '/api';
const TOKEN_KEY = 'carb_cycle_token';
const USER_KEY = 'carb_cycle_user';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  // Only a request that *sent* a session can have it expire/revoked (a wrong
  // password at login is also a 401 and must show its message, not reload).
  if (res.status === 401 && token) {
    let code = null;
    try { code = (await res.clone().json()).code; } catch {}
    auth.clearSession();
    if (code === 'suspended') {
      try { sessionStorage.setItem('auth_notice', 'suspended'); } catch {}
    }
    window.location.reload();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    let msg = `API error: ${res.status}`;
    try { const body = await res.json(); if (body.error) msg = body.error; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getConfig:   () => request('/config'),
  updateConfig: (data) => request('/config', { method: 'PUT', body: JSON.stringify(data) }),
  getSchedule: () => request('/schedule'),
  getDays:     () => request('/days'),
  // Date-keyed (canonical). Dates are the user's local YYYY-MM-DD — see shared/dates.js localIsoDate().
  getDaysRange:    (from, to) => request(`/days?${new URLSearchParams({ ...(from && { from }), ...(to && { to }) })}`),
  getDayByDate:    (date) => request(`/days/date/${date}`),
  updateDayByDate: (date, data) => request(`/days/date/${date}`, { method: 'PUT', body: JSON.stringify(data) }),
  getProgress:     (today, days = 90) => request(`/progress?${new URLSearchParams({ today, days })}`),
  getDay:      (idx) => request(`/days/${idx}`),
  updateDay:   (idx, data) => request(`/days/${idx}`, { method: 'PUT', body: JSON.stringify(data) }),
  getStats:    () => request('/stats'),
  getFoods:    () => request('/foods'),
  getFoodHistory: () => request('/foods/history'),
  setFavorite: (food_id, favorite) => request('/foods/favorites', { method: 'PUT', body: JSON.stringify({ food_id, favorite }) }),
  getInsights: () => request('/insights'),
  getPresets:  () => request('/presets'),
  savePreset:  (name, items) => request('/presets', { method: 'POST', body: JSON.stringify({ name, items }) }),
  deletePreset: (id) => request(`/presets/${id}`, { method: 'DELETE' }),
  createCustomFood: (data) => request('/foods/custom', { method: 'POST', body: JSON.stringify(data) }),
  deleteCustomFood: (foodId) => request(`/foods/custom/${foodId}`, { method: 'DELETE' }),
  getGroceryList: (days = 7) => request(`/grocery?days=${days}`),
  getWeeklyGrocery: (fromDay) => request(`/grocery/weekly${fromDay != null ? `?from_day=${fromDay}` : ''}`),
  getReminderStatus: () => request('/reminders/status'),
  getReminderConfig: () => request('/reminders/config'),
  startReminders: () => request('/reminders/start', { method: 'POST' }),
  stopReminders: () => request('/reminders/stop', { method: 'POST' }),
  sendReminder: () => request('/reminders/send', { method: 'POST' }),
  getProgrammeOptions: () => request('/programme/options'),
  getMyProgramme: () => request('/programme/me'),
  setupProgramme: (data) => request('/programme/setup', { method: 'POST', body: JSON.stringify(data) }),
  getMacroStats: () => request('/macro-stats'),
  getMacroWeek: (week) => request(`/macro-stats/week/${week}`),
  getProfile: () => request('/auth/profile'),
  changePassword: async (current_password, new_password) => {
    const r = await request('/auth/change-password', { method: 'POST', body: JSON.stringify({ current_password, new_password }) });
    // Other devices are signed out; keep this one signed in with the fresh token.
    if (r.token) auth.setSession(r.token, auth.getUser());
    return r;
  },
  me: () => request('/auth/me'),
  admin: {
    overview: () => request('/admin/overview'),
    users: (params = {}) => request(`/admin/users?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))}`),
    user: (id) => request(`/admin/users/${id}`),
    suspend: (id, reason) => request(`/admin/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) }),
    unsuspend: (id) => request(`/admin/users/${id}/unsuspend`, { method: 'POST' }),
    signOut: (id) => request(`/admin/users/${id}/sign-out`, { method: 'POST' }),
    resetPassword: (id) => request(`/admin/users/${id}/reset-password`, { method: 'POST' }),
    setRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'POST', body: JSON.stringify({ role }) }),
    remove: (id, confirm) => request(`/admin/users/${id}`, { method: 'DELETE', body: JSON.stringify({ confirm }) }),
    audit: (params = {}) => request(`/admin/audit?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))}`),
    auditCsv: async (params = {}) => {
      const res = await fetch(`${BASE}/admin/audit.csv?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))}`, {
        headers: { Authorization: `Bearer ${auth.getToken()}` },
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.blob();
    },
  },
};
