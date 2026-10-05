/**
 * HTTP-level: adaptive TDEE suggestion/accept/dismiss and weekly insights.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

const dbFile = path.join(os.tmpdir(), `cct-progress-${process.pid}-${Date.now()}.db`);
process.env.TURSO_DATABASE_URL = pathToFileURL(dbFile).href.replace('file:///', 'file:');
process.env.TURSO_AUTH_TOKEN = '';
process.env.JWT_SECRET = 'test-secret-not-for-production';

let server, base, client, token;
const TODAY = '2026-10-05';

async function call(method, url, body) {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  ({ client } = await import('../db/index.js'));
  const { migrate } = await import('../db/migrate.js');
  await migrate({ log: () => {} });

  const express = (await import('express')).default;
  const { requireAuth } = await import('../lib/auth.js');
  const app = express();
  app.use(express.json());
  app.use('/api/auth', (await import('./auth.js')).default);
  app.use('/api/programme', requireAuth, (await import('./programme.js')).default);
  app.use('/api/progress', requireAuth, (await import('./progress.js')).default);
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;

  const reg = await fetch(`${base}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'runner', password: 'password123' }),
  }).then((r) => r.json());
  token = reg.token;
  // Formula TDEE ≈ 2,759 (male, 30y, 180 cm, 80 kg, moderate)
  await call('POST', '/api/programme/setup', {
    programme: 'weight_loss', sex: 'male', age: 30, height_cm: 180, weight_kg: 80, activity_level: 'moderate',
    goal: 'lose', goal_rate_kg_week: 0.5, macro_preset: 'balanced',
  });

  // 28 days eating 2,500 kcal while losing 0.5 kg/week ⇒ real TDEE ≈ 3,050 (≈ +300 vs formula)
  const { upsertDay } = await import('../lib/dayLogs.js');
  const { addDays } = await import('../../shared/dates.js');
  const { rows } = await client.execute(`SELECT id FROM users WHERE username = 'runner'`);
  const id = Number(rows[0].id);
  await client.execute({ sql: 'UPDATE app_config SET start_date = ? WHERE user_id = ?', args: [addDays(TODAY, -30), id] });
  for (let i = 28; i >= 1; i--) {
    await upsertDay(id, addDays(TODAY, -i), {
      meals: { meal1: [{ food_id: '__quick', kcal: 2500, protein_g: 150 }] },
      water_liters: 3,
      weight_kg: +(82 - (28 - i) * (0.5 / 7)).toFixed(2),
    });
  }
});

afterAll(() => {
  server?.close();
  client?.close();
  try { fs.unlinkSync(dbFile); } catch {}
});

describe('adaptive TDEE', () => {
  it('suggests an update when real burn differs from the formula', async () => {
    const r = await call('GET', `/api/progress?today=${TODAY}&days=28`);
    expect(r.body.adaptive.status).toBe('ok');
    expect(r.body.adaptive.tdee).toBeGreaterThan(2950);
    expect(r.body.adaptive.tdee).toBeLessThan(3150);
    expect(r.body.adaptive.show).toBe(true);
  });

  it('dismiss hides it', async () => {
    await call('POST', '/api/progress/adaptive/dismiss');
    expect((await call('GET', `/api/progress?today=${TODAY}&days=28`)).body.adaptive.show).toBe(false);
  });

  it('accept stores the server-computed TDEE and recomputes the single target', async () => {
    const r = await call('POST', '/api/progress/adaptive/accept', { today: TODAY, tdee: 99999 /* ignored */ });
    expect(r.status).toBe(200);
    expect(r.body.tdee).toBeGreaterThan(2950);
    expect(r.body.tdee).toBeLessThan(3150);
    // 0.5 kg/week deficit = 550 kcal below the new TDEE
    expect(r.body.calorie_target).toBe(r.body.tdee - 550);

    const after = await call('GET', `/api/progress?today=${TODAY}&days=28`);
    expect(after.body.adaptive.suggest).toBe(false); // now matches what's stored
    expect(after.body.adaptive.accepted.to).toBe(r.body.tdee);
  });

  it('refuses when there is not enough data', async () => {
    const r = await call('POST', '/api/progress/adaptive/accept', { today: '2026-09-15' });
    expect(r.status).toBe(409);
  });
});

describe('weekly insights', () => {
  it('summarises the last 7 days', async () => {
    const r = await call('GET', `/api/progress/weekly?today=${TODAY}`);
    expect(r.body.from).toBe('2026-09-28');
    expect(r.body.daysLogged).toBe(7);
    const codes = r.body.findings.map((f) => f.code);
    expect(codes).toContain('logged_well');
    expect(codes).toContain('weight_down');
  });
});
