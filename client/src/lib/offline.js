/**
 * Offline support for the client:
 *  - an outbox: day saves made without a connection are kept on this device
 *    (one entry per day — the newest save wins) and replayed when back online
 *  - connection + sync status for the banner
 *  - clearing cached API data at logout (it belongs to one user)
 *  - the browser's "install app" prompt
 */
import { useSyncExternalStore } from 'react';

const KEY = (userId) => `outbox:${userId}`;
let state = { online: typeof navigator === 'undefined' ? true : navigator.onLine, pending: 0, syncing: false, installPrompt: null };
const listeners = new Set();
const set = (patch) => { state = { ...state, ...patch }; listeners.forEach((l) => l()); };

export function useOfflineState() {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => state);
}

// ── Outbox storage (this device only, by design) ───────────────────────
function currentUserId() {
  try { return JSON.parse(localStorage.getItem('carb_cycle_user'))?.id ?? null; } catch { return null; }
}
function read(userId = currentUserId()) {
  if (userId == null) return [];
  try { return JSON.parse(localStorage.getItem(KEY(userId))) || []; } catch { return []; }
}
function write(entries, userId = currentUserId()) {
  if (userId == null) return;
  try { localStorage.setItem(KEY(userId), JSON.stringify(entries)); } catch {}
  set({ pending: entries.length });
}

/** True for "couldn't reach the server" — not for a server that answered with an error. */
export function isNetworkError(err) {
  return err instanceof TypeError || err?.name === 'NetworkError' || (typeof navigator !== 'undefined' && !navigator.onLine);
}

/** Queue a write. Entries with the same key are replaced (a later save of the same day wins). */
export function enqueue({ key, method, path, body }) {
  const entries = read().filter((e) => e.key !== key);
  entries.push({ key, method, path, body, queued_at: new Date().toISOString() });
  write(entries);
}

let flushing = null;
/**
 * Replay queued writes in order. Stops at the first network failure (try again later);
 * drops entries the server rejects (4xx) so one bad entry can't block the rest.
 * @param {(method, path, body) => Promise} send  the API request function
 * @returns {Promise<number>} how many were synced
 */
export function flushOutbox(send) {
  if (flushing) return flushing;
  let entries = read();
  if (!entries.length || !navigator.onLine) return Promise.resolve(0);
  flushing = (async () => {
    set({ syncing: true });
    let synced = 0;
    try {
      while (entries.length) {
        const [e, ...rest] = entries;
        try {
          await send(e.method, e.path, e.body);
          synced++;
        } catch (err) {
          if (isNetworkError(err)) break;
          console.warn('[outbox] dropped a change the server rejected:', err.message);
        }
        entries = rest;
        write(entries);
      }
    } finally {
      set({ syncing: false });
      flushing = null;
    }
    if (synced) window.dispatchEvent(new CustomEvent('outbox:synced', { detail: { synced } }));
    return synced;
  })();
  return flushing;
}

// ── Lifecycle ──────────────────────────────────────────────────────────
let started = false;
export function startOffline(send) {
  set({ pending: read().length });
  if (started) return;
  started = true;
  window.addEventListener('online', () => { set({ online: true }); flushOutbox(send); });
  window.addEventListener('offline', () => set({ online: false }));
  // Some networks report "online" without working; retry quietly when the tab comes back.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') flushOutbox(send); });
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); set({ installPrompt: e }); });
  window.addEventListener('appinstalled', () => set({ installPrompt: null }));
  flushOutbox(send);
}

export async function promptInstall() {
  const p = state.installPrompt;
  if (!p) return false;
  p.prompt();
  const { outcome } = await p.userChoice;
  set({ installPrompt: null });
  return outcome === 'accepted';
}

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

/** Cached API responses belong to the signed-in user — wipe them at logout/login. */
export async function clearUserCaches() {
  try { if ('caches' in window) await caches.delete('api-get'); } catch {}
}
