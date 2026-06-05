const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
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
};
