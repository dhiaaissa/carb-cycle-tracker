import { Router } from 'express';
import { db } from '../db/index.js';
import { dayLogs } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getDayType, getPhase } from '../lib/schedule.js';
import { calculateDay, calculateScore } from '../lib/calories.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const rows = await db.select().from(dayLogs).where(eq(dayLogs.user_id, req.user.id)).all();
    res.json(rows.map(parseJsonFields));
  } catch (err) { next(err); }
});

router.get('/:dayIndex', async (req, res, next) => {
  try {
    const idx = parseInt(req.params.dayIndex, 10);
    if (isNaN(idx) || idx < 0 || idx > 3650)
      return res.status(400).json({ error: 'day_index must be 0–3650' });

    const row = await db.select().from(dayLogs)
      .where(and(eq(dayLogs.user_id, req.user.id), eq(dayLogs.day_index, idx)))
      .get();
    res.json(row ? parseJsonFields(row) : null);
  } catch (err) { next(err); }
});

router.put('/:dayIndex', async (req, res, next) => {
  try {
    const idx = parseInt(req.params.dayIndex, 10);
    if (isNaN(idx) || idx < 0 || idx > 3650)
      return res.status(400).json({ error: 'day_index must be 0–3650' });

    const dayType = getDayType(idx);
    const phase   = getPhase(idx);
    const now     = new Date().toISOString();
    const body    = req.body;

    const existing = await db.select().from(dayLogs)
      .where(and(eq(dayLogs.user_id, req.user.id), eq(dayLogs.day_index, idx)))
      .get();
    const base = existing ? parseJsonFields(existing) : {
      meals_json:   {},
      workout_json: [],
      water_liters: 0,
      workout_done: false,
      mood:         null,
      energy_level: null,
      weight_kg:    null,
      cheat_meal:   false,
      notes:        null,
    };

    const mealsObj = body.meals !== undefined ? body.meals : (base.meals_json || {});

    const water      = body.water_liters   !== undefined ? body.water_liters   : base.water_liters;
    const workout    = body.workout_done   !== undefined ? body.workout_done   : base.workout_done;
    const workoutLog = body.workout_json   !== undefined ? body.workout_json   : (base.workout_json || []);
    const mood       = body.mood           !== undefined ? body.mood           : base.mood;
    const energy     = body.energy_level   !== undefined ? body.energy_level   : base.energy_level;
    const weight     = body.weight_kg      !== undefined ? body.weight_kg      : base.weight_kg;
    const cheat      = body.cheat_meal     !== undefined ? body.cheat_meal     : base.cheat_meal;
    const notes      = body.notes          !== undefined ? body.notes          : base.notes;
    const waist      = body.waist_cm       !== undefined ? body.waist_cm       : base.waist_cm ?? null;
    const chest      = body.chest_cm       !== undefined ? body.chest_cm       : base.chest_cm ?? null;
    const arm        = body.arm_cm         !== undefined ? body.arm_cm         : base.arm_cm ?? null;
    const thigh      = body.thigh_cm       !== undefined ? body.thigh_cm       : base.thigh_cm ?? null;

    const cal = calculateDay(dayType, mealsObj, workout);
    const cheatKcal = body.cheat_kcal || 0;
    cal.calories_consumed += cheatKcal;
    cal.calories_remaining -= cheatKcal;

    const score = calculateScore(
      dayType,
      cal.meal1_done, cal.meal2_done, cal.meal3_done, cal.meal4_done,
      water
    );

    const record = {
      user_id:            req.user.id,
      day_index:          idx,
      day_type:           dayType,
      phase,
      meal1_done:         cal.meal1_done,
      meal2_done:         cal.meal2_done,
      meal3_done:         cal.meal3_done,
      meal4_done:         cal.meal4_done,
      water_liters:       water,
      workout_done:       workout,
      mood,
      energy_level:       energy,
      weight_kg:          weight,
      waist_cm:           waist,
      chest_cm:           chest,
      arm_cm:             arm,
      thigh_cm:           thigh,
      cheat_meal:         cheat,
      notes,
      calories_consumed:  cal.calories_consumed,
      calories_target:    cal.calories_target,
      calories_remaining: cal.calories_remaining,
      protein_g:          cal.protein_g,
      carbs_g:            cal.carbs_g,
      fat_g:              cal.fat_g,
      score,
      meals_json:         JSON.stringify(mealsObj),
      workout_json:       JSON.stringify(workoutLog),
      updated_at:         now,
    };

    if (existing) {
      await db.update(dayLogs).set(record)
        .where(and(eq(dayLogs.user_id, req.user.id), eq(dayLogs.day_index, idx)))
        .run();
    } else {
      record.created_at = now;
      await db.insert(dayLogs).values(record).run();
    }

    const updated = await db.select().from(dayLogs)
      .where(and(eq(dayLogs.user_id, req.user.id), eq(dayLogs.day_index, idx)))
      .get();
    res.json(parseJsonFields(updated));
  } catch (err) { next(err); }
});

function parseJsonFields(row) {
  let meals_json = {};
  let workout_json = [];
  try { meals_json = JSON.parse(row.meals_json || '{}'); } catch {}
  try { workout_json = JSON.parse(row.workout_json || '[]'); } catch {}
  return { ...row, meals_json, workout_json };
}

export default router;
