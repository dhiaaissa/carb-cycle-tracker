/**
 * End-to-end over HTTP: auth + admin routes against a throwaway SQLite file.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

const dbFile = path.join(os.tmpdir(), `cct-admin-${process.pid}-${Date.now()}.db`);
process.env.TURSO_DATABASE_URL = pathToFileURL(dbFile).href.replace('file:///', 'file:');
process.env.TURSO_AUTH_TOKEN = '';
process.env.JWT_SECRET = 'test-secret-not-for-production';
process.env.OWNER_USERNAME = 'boss';

let server, base, client;

async function call(method, url, { token, body } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}
const register = (username) => call('POST', '/api/auth/register', { body: { username, password: 'password123' } });
const login = (username, password = 'password123') => call('POST', '/api/auth/login', { body: { username, password } });

const tok = {};
const ids = {};

beforeAll(async () => {
  ({ client } = await import('../db/index.js'));
  const { migrate } = await import('../db/migrate.js');
  await migrate({ log: () => {} });

  const express = (await import('express')).default;
  const { requireAuth, requireRole, STAFF_ROLES } = await import('../lib/auth.js');
  const app = express();
  app.use(express.json());
  app.use('/api/auth', (await import('./auth.js')).default);
  app.use('/api/admin', requireAuth, requireRole(...STAFF_ROLES), (await import('./admin.js')).default);
  app.get('/api/ping', requireAuth, (req, res) => res.json({ ok: true, role: req.user.role }));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;

  for (const u of ['boss', 'mod', 'alice', 'bob']) {
    const r = await register(u);
    tok[u] = r.body.token;
    ids[u] = r.body.user.id;
  }
});

afterAll(() => {
  server?.close();
  client?.close();
  try { fs.unlinkSync(dbFile); } catch {}
});

describe('roles', () => {
  it('the owner account becomes super admin on registration', async () => {
    expect((await call('GET', '/api/auth/me', { token: tok.boss })).body.user.role).toBe('superadmin');
    expect((await call('GET', '/api/auth/me', { token: tok.alice })).body.user.role).toBe('user');
  });

  it('regular users cannot reach the admin API', async () => {
    expect((await call('GET', '/api/admin/overview', { token: tok.alice })).status).toBe(403);
    expect((await call('GET', '/api/admin/overview')).status).toBe(401);
  });

  it('super admin can make a moderator', async () => {
    const r = await call('POST', `/api/admin/users/${ids.mod}/role`, { token: tok.boss, body: { role: 'moderator' } });
    expect(r.status).toBe(200);
    expect((await call('GET', '/api/admin/overview', { token: tok.mod })).status).toBe(200);
  });

  it('moderators cannot reset passwords, change roles or delete', async () => {
    expect((await call('POST', `/api/admin/users/${ids.alice}/reset-password`, { token: tok.mod })).status).toBe(403);
    expect((await call('POST', `/api/admin/users/${ids.alice}/role`, { token: tok.mod, body: { role: 'moderator' } })).status).toBe(403);
    expect((await call('DELETE', `/api/admin/users/${ids.alice}`, { token: tok.mod, body: { confirm: 'alice' } })).status).toBe(403);
  });

  it('moderators cannot act on staff', async () => {
    expect((await call('POST', `/api/admin/users/${ids.boss}/suspend`, { token: tok.mod })).status).toBe(403);
  });
});

describe('safety rails', () => {
  it('nobody can act on their own account', async () => {
    expect((await call('POST', `/api/admin/users/${ids.boss}/suspend`, { token: tok.boss })).status).toBe(400);
    expect((await call('POST', `/api/admin/users/${ids.boss}/role`, { token: tok.boss, body: { role: 'user' } })).status).toBe(400);
  });

  it('the last super admin cannot be demoted by anyone', async () => {
    await call('POST', `/api/admin/users/${ids.mod}/role`, { token: tok.boss, body: { role: 'superadmin' } });
    // mod (now superadmin) demotes boss: allowed while two exist…
    expect((await call('POST', `/api/admin/users/${ids.boss}/role`, { token: tok.mod, body: { role: 'user' } })).status).toBe(200);
    // …but boss can't then demote the last one (boss is no longer staff → 403 at the gate).
    expect((await call('GET', '/api/admin/overview', { token: tok.boss })).status).toBe(403);
    // restore
    expect((await call('POST', `/api/admin/users/${ids.boss}/role`, { token: tok.mod, body: { role: 'superadmin' } })).status).toBe(200);
    await call('POST', `/api/admin/users/${ids.mod}/role`, { token: tok.boss, body: { role: 'moderator' } });
  });

  it('rejects unknown roles', async () => {
    expect((await call('POST', `/api/admin/users/${ids.alice}/role`, { token: tok.boss, body: { role: 'god' } })).status).toBe(400);
  });
});

describe('moderation', () => {
  it('suspending kills existing sessions and blocks login', async () => {
    expect((await call('GET', '/api/ping', { token: tok.alice })).status).toBe(200);
    expect((await call('POST', `/api/admin/users/${ids.alice}/suspend`, { token: tok.mod, body: { reason: 'spam' } })).status).toBe(200);

    expect((await call('GET', '/api/ping', { token: tok.alice })).status).toBe(401);
    const l = await login('alice');
    expect(l.status).toBe(403);
    expect(l.body.code).toBe('suspended');
  });

  it('unsuspending allows login again', async () => {
    await call('POST', `/api/admin/users/${ids.alice}/unsuspend`, { token: tok.mod });
    const l = await login('alice');
    expect(l.status).toBe(200);
    tok.alice = l.body.token;
  });

  it('sign out everywhere revokes tokens', async () => {
    await call('POST', `/api/admin/users/${ids.alice}/sign-out`, { token: tok.mod });
    expect((await call('GET', '/api/ping', { token: tok.alice })).status).toBe(401);
  });

  it('password reset returns a one-time password that works, old one does not', async () => {
    const r = await call('POST', `/api/admin/users/${ids.bob}/reset-password`, { token: tok.boss });
    expect(r.body.temporary_password).toMatch(/^[\w-]{10,}$/);
    expect((await login('bob')).status).toBe(401);
    expect((await login('bob', r.body.temporary_password)).status).toBe(200);
  });

  it('changing your own password signs out other devices but returns a fresh token', async () => {
    const first = (await login('alice')).body.token;
    const second = (await login('alice')).body.token;
    const r = await call('POST', '/api/auth/change-password', { token: first, body: { current_password: 'password123', new_password: 'newpass456' } });
    expect(r.status).toBe(200);
    expect((await call('GET', '/api/ping', { token: second })).status).toBe(401);
    expect((await call('GET', '/api/ping', { token: r.body.token })).status).toBe(200);
  });

  it('deleting requires typing the username and removes the account', async () => {
    expect((await call('DELETE', `/api/admin/users/${ids.bob}`, { token: tok.boss, body: { confirm: 'nope' } })).status).toBe(400);
    expect((await call('DELETE', `/api/admin/users/${ids.bob}`, { token: tok.boss, body: { confirm: 'bob' } })).status).toBe(200);
    expect((await call('GET', `/api/admin/users/${ids.bob}`, { token: tok.boss })).status).toBe(404);
  });
});

describe('dashboard & activity log', () => {
  it('overview has totals and a 30-day series', async () => {
    const r = await call('GET', '/api/admin/overview', { token: tok.boss });
    expect(r.body.totals.users).toBe(3);
    expect(r.body.series).toHaveLength(30);
    expect(r.body.totals.failed_logins_24h).toBeGreaterThanOrEqual(1);
  });

  it('user list supports search and never exposes password hashes', async () => {
    const r = await call('GET', '/api/admin/users?q=ali', { token: tok.mod });
    expect(r.body.users.map((u) => u.username)).toEqual(['alice']);
    const detail = await call('GET', `/api/admin/users/${ids.alice}`, { token: tok.mod });
    expect(detail.body.user.password_hash).toBeUndefined();
    expect(detail.body.user.token_version).toBeUndefined();
  });

  it('records who did what, including admin views and failed logins', async () => {
    const r = await call('GET', '/api/admin/audit', { token: tok.boss });
    const actions = r.body.entries.map((e) => e.action);
    for (const a of ['auth.register', 'auth.login_failed', 'auth.login_blocked', 'admin.suspend', 'admin.password_reset', 'admin.user_delete', 'admin.user_view', 'auth.password_change']) {
      expect(actions).toContain(a);
    }
    const del = r.body.entries.find((e) => e.action === 'admin.user_delete');
    expect(del.actor_username).toBe('boss');
    expect(del.target_label).toBe('bob');
    // the temporary password must never land in the log
    expect(JSON.stringify(r.body.entries)).not.toMatch(/temporary_password/);
  });

  it('filters by category and exports CSV', async () => {
    const r = await call('GET', '/api/admin/audit?category=admin', { token: tok.boss });
    expect(r.body.entries.every((e) => e.action.startsWith('admin.'))).toBe(true);
    const csv = await call('GET', '/api/admin/audit.csv', { token: tok.boss });
    expect(csv.status).toBe(200);
    expect(String(csv.body).split('\n')[0]).toBe('time,action,actor,target,details,ip');
  });
});
