import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

// Minimal browser stand-ins (the module only touches these).
const store = new Map();
let online = true;
const events = [];
beforeAll(() => {
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { get onLine() { return online; } } });
  globalThis.window = { dispatchEvent: (e) => events.push(e.type), addEventListener() {}, matchMedia: () => ({ matches: false }) };
  globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
  localStorage.setItem('carb_cycle_user', JSON.stringify({ id: 7 }));
});

let mod;
beforeEach(async () => {
  mod = mod || (await import('./offline.js'));
  store.delete('outbox:7');
  online = true;
  events.length = 0;
});
const queued = () => JSON.parse(localStorage.getItem('outbox:7') || '[]');

describe('outbox', () => {
  it('keeps one entry per day — the newest save wins', () => {
    mod.enqueue({ key: 'day:3', method: 'PUT', path: '/days/3', body: { water_liters: 1 } });
    mod.enqueue({ key: 'day:4', method: 'PUT', path: '/days/4', body: {} });
    mod.enqueue({ key: 'day:3', method: 'PUT', path: '/days/3', body: { water_liters: 2 } });
    expect(queued().map((e) => [e.key, e.body.water_liters])).toEqual([['day:4', undefined], ['day:3', 2]]);
  });

  it('replays in order and empties the queue', async () => {
    mod.enqueue({ key: 'a', method: 'PUT', path: '/a', body: {} });
    mod.enqueue({ key: 'b', method: 'PUT', path: '/b', body: {} });
    const sent = [];
    expect(await mod.flushOutbox(async (m, p) => { sent.push(p); })).toBe(2);
    expect(sent).toEqual(['/a', '/b']);
    expect(queued()).toEqual([]);
    expect(events).toContain('outbox:synced');
  });

  it('stops at a network failure and keeps the rest', async () => {
    mod.enqueue({ key: 'a', method: 'PUT', path: '/a', body: {} });
    mod.enqueue({ key: 'b', method: 'PUT', path: '/b', body: {} });
    await mod.flushOutbox(async () => { throw new TypeError('Failed to fetch'); });
    expect(queued().map((e) => e.key)).toEqual(['a', 'b']);
  });

  it('drops entries the server rejects so they cannot block the queue', async () => {
    mod.enqueue({ key: 'bad', method: 'PUT', path: '/bad', body: {} });
    mod.enqueue({ key: 'ok', method: 'PUT', path: '/ok', body: {} });
    const sent = [];
    await mod.flushOutbox(async (m, p) => { if (p === '/bad') throw new Error('400'); sent.push(p); });
    expect(sent).toEqual(['/ok']);
    expect(queued()).toEqual([]);
  });

  it('does nothing while offline — and does not get stuck (regression)', async () => {
    mod.enqueue({ key: 'a', method: 'PUT', path: '/a', body: {} });
    online = false;
    expect(await mod.flushOutbox(async () => {})).toBe(0);
    online = true;
    let calls = 0;
    expect(await mod.flushOutbox(async () => { calls++; })).toBe(1);
    expect(calls).toBe(1);
  });

  it('classifies network errors', () => {
    expect(mod.isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
    expect(mod.isNetworkError(new Error('API error: 500'))).toBe(false);
  });
});
