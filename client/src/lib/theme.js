/**
 * Light / dark / system theme. The preference lives in localStorage so it
 * applies before React mounts (see the inline script in index.html).
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';

const KEY = 'theme';
const THEMES = ['system', 'light', 'dark'];
const META_COLOR = { light: '#f8fafc', dark: '#030712' };

const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function readPref() {
  try {
    const v = localStorage.getItem(KEY);
    return THEMES.includes(v) ? v : 'system';
  } catch { return 'system'; }
}

export function resolveTheme(pref) {
  return pref === 'system' ? (media().matches ? 'dark' : 'light') : pref;
}

export function applyTheme(pref = readPref()) {
  const resolved = resolveTheme(pref);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[resolved]);
  return resolved;
}

const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

function subscribe(cb) {
  listeners.add(cb);
  const m = media();
  const onSystem = () => { if (readPref() === 'system') { applyTheme(); cb(); } };
  m.addEventListener('change', onSystem);
  return () => { listeners.delete(cb); m.removeEventListener('change', onSystem); };
}

const snapshot = () => `${readPref()}:${document.documentElement.classList.contains('dark') ? 'dark' : 'light'}`;

/** @returns {{ pref: 'system'|'light'|'dark', resolved: 'light'|'dark', setPref, cycle }} */
export function useTheme() {
  const [pref, resolved] = useSyncExternalStore(subscribe, snapshot).split(':');

  useEffect(() => { applyTheme(pref); }, [pref]);

  const setPref = useCallback((p) => {
    try { localStorage.setItem(KEY, p); } catch {}
    applyTheme(p);
    notify();
  }, []);

  const cycle = useCallback(() => setPref(THEMES[(THEMES.indexOf(readPref()) + 1) % THEMES.length]), [setPref]);

  return { pref, resolved, setPref, cycle };
}

/** Read a palette colour as a CSS colour string — for <canvas>/SVG code that can't use classes. */
export function themeColor(name, shade) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}-${shade}`).trim();
  return v ? `rgb(${v})` : undefined;
}
