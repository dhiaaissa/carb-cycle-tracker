/**
 * Integration test: legacy (day_index-keyed) database → migration → date-keyed logs.
 * Runs against a throwaway SQLite file, never the real database.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

const dbFile = path.join(os.tmpdir(), `cct-test-${process.pid}-${Date.now()}.db`);
process.env.TURSO_DATABASE_URL = pathToFileURL(dbFile).href.replace('file:///', 'file:');
process.env.TURSO_AUTH_TOKEN = '';

let client, migrate, upsertDay, getDayByDate, listDays, resyncDayIndexes;

const CYCLE = 1; // carb_cycle user, started 2026-01-01
const LOSS = 2;  // weight_loss user, started 2026-01-01

beforeAll(async () => {
  ({ client } = await import('../db/index.js'));

  // Recreate the pre-Phase-2 shape: no `date` column, UNIQUE(user_id, day_index).
  await client.executeMultiple(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL,
      sex TEXT, age INTEGER, height_cm REAL, activity_level TEXT);
    CREATE TABLE app_config (id INTEGER PRIMARY KEY, start_date TEXT NOT NULL, settings_json TEXT NOT NULL DEFAULT '{}',
      user_id INTEGER NOT NULL DEFAULT 0, programme TEXT NOT NULL DEFAULT 'carb_cycle', goal_weight_kg REAL, current_weight_kg REAL,
      bmr REAL, tdee REAL, calorie_target REAL, protein_g_target REAL, carbs_g_target REAL, fat_g_target REAL);
    CREATE TABLE day_logs (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL DEFAULT 0, day_index INTEGER NOT NULL, day_type TEXT NOT NULL,
      phase INTEGER NOT NULL, meal1_done INTEGER NOT NULL DEFAULT 0, meal2_done INTEGER NOT NULL DEFAULT 0, meal3_done INTEGER NOT NULL DEFAULT 0,
      meal4_done INTEGER NOT NULL DEFAULT 0, water_liters REAL NOT NULL DEFAULT 0, workout_done INTEGER NOT NULL DEFAULT 0, mood TEXT,
      energy_level INTEGER, weight_kg REAL, cheat_meal INTEGER NOT NULL DEFAULT 0, notes TEXT, calories_consumed REAL NOT NULL DEFAULT 0,
      calories_target REAL NOT NULL DEFAULT 0, calories_remaining REAL NOT NULL DEFAULT 0, protein_g REAL NOT NULL DEFAULT 0,
      carbs_g REAL NOT NULL DEFAULT 0, fat_g REAL NOT NULL DEFAULT 0, score INTEGER NOT NULL DEFAULT 0,
      meals_json TEXT NOT NULL DEFAULT '{}', workout_json TEXT NOT NULL DEFAULT '[]', waist_cm REAL, chest_cm REAL, arm_cm REAL, thigh_cm REAL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE UNIQUE INDEX day_logs_user_day_unique ON day_logs(user_id, day_index);
    CREATE TABLE meal_presets (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL DEFAULT 0, name TEXT NOT NULL, items_json TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE custom_foods (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL DEFAULT 0, food_id TEXT NOT NULL, name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '🍽️', category TEXT NOT NULL DEFAULT 'custom', unit TEXT NOT NULL DEFAULT 'g', kcal_per_100g REAL,
      protein_per_100g REAL, carbs_per_100g REAL, fat_per_100g REAL, kcal_per_unit REAL, protein_per_unit REAL, carbs_per_unit REAL,
      fat_per_unit REAL, default_amount REAL NOT NULL DEFAULT 100, step REAL NOT NULL DEFAULT 25, created_at TEXT NOT NULL);

    INSERT INTO users VALUES (1, 'cycle', 'x', '2026-01-01', NULL, NULL, NULL, NULL);
    INSERT INTO users VALUES (2, 'loss', 'x', '2026-01-01', 'male', 30, 180, 'moderate');
    INSERT INTO app_config (user_id, start_date, programme) VALUES (1, '2026-01-01', 'carb_cycle');
    INSERT INTO app_config (user_id, start_date, programme, current_weight_kg, tdee, calorie_target, protein_g_target, carbs_g_target, fat_g_target)
      VALUES (2, '2026-01-01', 'weight_loss', 80, 2759, 2209, 176, 220, 74);
    INSERT INTO day_logs (user_id, day_index, day_type, phase, weight_kg, created_at, updated_at) VALUES (1, 0, 'med', 1, 80, 'x', 'x');
    INSERT INTO day_logs (user_id, day_index, day_type, phase, weight_kg, created_at, updated_at) VALUES (1, 31, 'low', 3, 79, 'x', 'x');
    INSERT INTO day_logs (user_id, day_index, day_type, phase, created_at, updated_at) VALUES (2, 10, 'low', 1, 'x', 'x');
  `);

  ({ migrate } = await import('../db/migrate.js'));
  await migrate({ log: () => {} });
  ({ upsertDay, getDayByDate, listDays, resyncDayIndexes } = await import('./dayLogs.js'));
});

afterAll(() => {
  client?.close();
  try { fs.unlinkSync(dbFile); } catch {}
});

describe('migration', () => {
  it('backfills dates from start_date + day_index', async () => {
    const rows = (await client.execute('SELECT user_id, day_index, date FROM day_logs ORDER BY id')).rows;
    expect(rows.map((r) => r.date)).toEqual(['2026-01-01', '2026-02-01', '2026-01-11']);
  });

  it('replaces the day_index unique index with a date one', async () => {
    const idx = (await client.execute('PRAGMA index_list(day_logs)')).rows.map((r) => r.name);
    expect(idx).toContain('day_logs_user_date_unique');
    expect(idx).not.toContain('day_logs_user_day_unique');
  });

  it('adds goal and profile columns', async () => {
    const cfgCols = (await client.execute('PRAGMA table_info(app_config)')).rows.map((r) => r.name);
    expect(cfgCols).toEqual(expect.arrayContaining(['goal', 'goal_rate_kg_week', 'macro_preset', 'units']));
    const userCols = (await client.execute('PRAGMA table_info(users)')).rows.map((r) => r.name);
    expect(userCols).toContain('body_fat_pct');
  });

  it('is idempotent', async () => {
    await expect(migrate({ log: () => {} })).resolves.toBeUndefined();
    const n = (await client.execute('SELECT COUNT(*) AS n FROM day_logs')).rows[0].n;
    expect(Number(n)).toBe(3);
  });
});

describe('date-keyed day logs', () => {
  it('reads migrated logs by date', async () => {
    expect((await getDayByDate(CYCLE, '2026-02-01')).weight_kg).toBe(79);
    expect(await getDayByDate(CYCLE, '2026-02-02')).toBeNull();
  });

  it('weight-loss users can log after day 55 (used to 500)', async () => {
    const row = await upsertDay(LOSS, '2026-06-01', { water_liters: 2 });
    expect(row.day_index).toBe(151);
    expect(row.day_type).toBe('flat');
    expect(row.calories_target).toBe(2209); // their own target, not a carb-cycle number
  });

  it('repairs mislabelled macro-programme rows on save', async () => {
    const row = await upsertDay(LOSS, '2026-01-11', { notes: 'hi' });
    expect(row.day_type).toBe('flat');
    expect(row.calories_target).toBe(2209);
  });

  it('carb-cycle days get their scheduled type', async () => {
    expect((await upsertDay(CYCLE, '2026-01-02', {})).day_type).toBe('low'); // day 1
    expect((await upsertDay(CYCLE, '2026-01-01', {})).day_type).toBe('med'); // existing, day 0
  });

  it('carb-cycle days outside the schedule are flat', async () => {
    const row = await upsertDay(CYCLE, '2026-04-01', {});
    expect(row.day_type).toBe('flat');
    expect(row.phase).toBe(0);
  });

  it('patches only the fields sent', async () => {
    await upsertDay(CYCLE, '2026-01-03', { water_liters: 3, notes: 'a' });
    const row = await upsertDay(CYCLE, '2026-01-03', { notes: 'b' });
    expect(row.water_liters).toBe(3);
    expect(row.notes).toBe('b');
  });

  it('lists a date range in order', async () => {
    const rows = await listDays(CYCLE, { from: '2026-01-01', to: '2026-01-31' });
    expect(rows.map((r) => r.date)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
  });

  it('changing start_date keeps logs on their dates and their logged type', async () => {
    await client.execute(`UPDATE app_config SET start_date = '2026-01-15' WHERE user_id = ${CYCLE}`);
    await resyncDayIndexes(CYCLE, '2026-01-15');

    const feb1 = await getDayByDate(CYCLE, '2026-02-01');
    expect(feb1.weight_kg).toBe(79);
    expect(feb1.day_index).toBe(17);
    expect(feb1.day_type).toBe('low');
    expect((await getDayByDate(CYCLE, '2026-01-01')).day_index).toBe(-14);
  });
});
