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
  if (res.status === 401) {
    auth.clearSession();
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
  getDay:      (idx) => request(`/days/${idx}`),
  updateDay:   (idx, data) => request(`/days/${idx}`, { method: 'PUT', body: JSON.stringify(data) }),
  getStats:    () => request('/stats'),
  getFoods:    () => request('/foods'),
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
};
