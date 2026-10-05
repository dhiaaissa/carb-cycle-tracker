/**
 * Recent / frequent / favourite foods, shared by every meal composer on the page.
 * One fetch, cached; call invalidateFoodHistory() after a day is saved.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { api } from './api';

const EMPTY = { recent: [], frequent: [], favorites: [] };
let state = EMPTY;
let loading = null;
let stale = true;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

function load() {
  if (loading || !stale) return loading;
  loading = api.getFoodHistory()
    .then((d) => { state = { recent: d.recent || [], frequent: d.frequent || [], favorites: d.favorites || [] }; stale = false; emit(); })
    .catch(() => {})
    .finally(() => { loading = null; });
  return loading;
}

export function invalidateFoodHistory() {
  stale = true;
  if (listeners.size) load();
}

export async function toggleFavorite(foodId) {
  const favorite = !state.favorites.includes(foodId);
  // Optimistic: the star responds instantly; the server merges and confirms.
  state = { ...state, favorites: favorite ? [...state.favorites, foodId] : state.favorites.filter((f) => f !== foodId) };
  emit();
  try {
    const r = await api.setFavorite(foodId, favorite);
    state = { ...state, favorites: r.favorites };
    emit();
  } catch {
    invalidateFoodHistory();
  }
}

export function useFoodHistory() {
  const snap = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => state);
  useEffect(() => { load(); }, []);
  return snap;
}
