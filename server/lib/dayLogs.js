/**
 * Day-log persistence. A log's identity is (user_id, date); day_index is a
 * cached "days since start_date" kept for the carb-cycle views.
 */
import { db, client } from '../db/index.js';
import { dayLogs, users } from '../db/schema.js';
import { eq, and, gte, lte, asc } from 'drizzle-orm';
import { dayContext } from './schedule.js';
import { calculateDay, calculateScore } from './calories.js';
import { dayTargetsFor } from './targets.js';
import { getOrCreateConfig } from './userConfig.js';

export function parseJsonFields(row) {
  let meals_json = {};
  let workout_json = [];
  try { meals_json = JSON.parse(row.meals_json || '{}'); } catch {}
  try { workout_json = JSON.parse(row.workout_json || '[]'); } catch {}
  return { ...row, meals_json, workout_json };
}

const byDate = (userId, date) => and(eq(dayLogs.user_id, userId), eq(dayLogs.date, date));

export async function getDayByDate(userId, date) {
  const row = await db.select().from(dayLogs).where(byDate(userId, date)).get();
  return row ? parseJsonFields(row) : null;
}

/** All logs for a user, optionally limited to an inclusive date range, oldest first. */
export async function listDays(userId, { from, to } = {}) {
  const conds = [eq(dayLogs.user_id, userId)];
  if (from) conds.push(gte(dayLogs.date, from));
  if (to) conds.push(lte(dayLogs.date, to));
  const rows = await db.select().from(dayLogs).where(and(...conds)).orderBy(asc(dayLogs.date)).all();
  return rows.map(parseJsonFields);
}

const FIELDS = [
  'water_liters', 'workout_done', 'mood', 'energy_level', 'weight_kg', 'cheat_meal', 'notes',
  'waist_cm', 'chest_cm', 'arm_cm', 'thigh_cm',
];

const EMPTY = {
  meals_json: {}, workout_json: [], water_liters: 0, workout_done: false, mood: null,
  energy_level: null, weight_kg: null, cheat_meal: false, notes: null,
  waist_cm: null, chest_cm: null, arm_cm: null, thigh_cm: null,
};

/**
 * Creates or patches the log for `date`. Fields absent from `body` keep their
 * current value. Totals, target and score are always recomputed server-side.
 */
export async function upsertDay(userId, date, body = {}) {
  const [cfg, user] = await Promise.all([
    getOrCreateConfig(userId),
    db.select().from(users).where(eq(users.id, userId)).get(),
  ]);
  const { day_index, day_type, phase } = dayContext(cfg, date);
  const existing = await getDayByDate(userId, date);
  const base = existing ?? EMPTY;

  const pick = (k) => (body[k] !== undefined ? body[k] : base[k] ?? EMPTY[k]);
  const fields = Object.fromEntries(FIELDS.map((k) => [k, pick(k)]));
  const meals = body.meals !== undefined ? body.meals : base.meals_json;
  const workoutLog = body.workout_json !== undefined ? body.workout_json : base.workout_json;

  // Carb cycle: keep the day type it was logged under, so a later start_date
  // change doesn't turn a logged low day into a med day. Other programmes are
  // always flat (this also repairs rows that were mislabelled low/med/high).
  const isCycle = (cfg.programme ?? 'carb_cycle') === 'carb_cycle';
  const type = isCycle ? (existing?.day_type ?? day_type) : 'flat';
  const cal = calculateDay(type, meals, fields.workout_done, dayTargetsFor(cfg, user));
  const cheatKcal = body.cheat_kcal || 0;
  cal.calories_consumed += cheatKcal;
  cal.calories_remaining -= cheatKcal;

  const now = new Date().toISOString();
  const record = {
    user_id: userId,
    date,
    day_index,
    day_type: type,
    phase: isCycle ? (existing?.phase ?? phase) : 0,
    ...fields,
    meal1_done: cal.meal1_done,
    meal2_done: cal.meal2_done,
    meal3_done: cal.meal3_done,
    meal4_done: cal.meal4_done,
    calories_consumed: cal.calories_consumed,
    calories_target: cal.calories_target,
    calories_remaining: cal.calories_remaining,
    protein_g: cal.protein_g,
    carbs_g: cal.carbs_g,
    fat_g: cal.fat_g,
    score: calculateScore(type, cal.meal1_done, cal.meal2_done, cal.meal3_done, cal.meal4_done, fields.water_liters),
    meals_json: JSON.stringify(meals),
    workout_json: JSON.stringify(workoutLog),
    updated_at: now,
  };

  if (existing) {
    await db.update(dayLogs).set(record).where(byDate(userId, date)).run();
  } else {
    await db.insert(dayLogs).values({ ...record, created_at: now }).run();
  }
  return getDayByDate(userId, date);
}

/** After start_date changes, recompute every cached day_index from its date. */
export async function resyncDayIndexes(userId, startDate) {
  await client.execute({
    sql: `UPDATE day_logs
          SET day_index = CAST(julianday(date) - julianday(?) AS INTEGER)
          WHERE user_id = ? AND date IS NOT NULL`,
    args: [startDate, userId],
  });
}
