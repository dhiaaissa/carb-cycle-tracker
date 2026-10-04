/**
 * Calendar-date helpers. Every date in the app is a plain 'YYYY-MM-DD' string
 * in the *user's* local calendar — never a timestamp — so a meal logged at
 * 23:30 in Tunis stays on that day regardless of server timezone.
 */

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

/** Strict YYYY-MM-DD check that also rejects impossible dates like 2026-02-30. */
export function isIsoDate(s) {
  if (typeof s !== 'string') return false;
  const m = ISO_RE.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

const toUtc = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export function addDays(iso, n) {
  return new Date(toUtc(iso) + n * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(from, to) {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** Local calendar date for a Date (defaults to now) — use on the client. */
export function localIsoDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Inclusive list of dates from → to. Empty if from > to. */
export function dateRange(from, to) {
  const n = diffDays(from, to);
  return Array.from({ length: Math.max(0, n + 1) }, (_, i) => addDays(from, i));
}
