import { Router } from 'express';
import { db } from '../db/index.js';
import { appConfig, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { calcTargets, validateStats, validateGoalSettings, PROGRAMMES } from '../lib/nutrition.js';

const router = Router();

router.get('/options', (_req, res) => {
  res.json({ programmes: PROGRAMMES });
});

router.post('/setup', async (req, res, next) => {
  try {
    const {
      programme, sex, age, height_cm, weight_kg, activity_level, goal_weight_kg,
      body_fat_pct = null, goal = null, goal_rate_kg_week = null, macro_preset = null, units,
    } = req.body || {};

    if (!PROGRAMMES[programme]) {
      return res.status(400).json({ error: 'Unknown programme' });
    }

    const prog = PROGRAMMES[programme];

    const goalErrors = validateGoalSettings({ goal, goal_rate_kg_week, macro_preset, units });
    if (goalErrors.length) return res.status(400).json({ error: goalErrors.join(', ') });

    // null = "use the programme's default"
    const updates = { programme, goal, goal_rate_kg_week, macro_preset };
    if (units) updates.units = units;
    let warnings = [];

    // Carb cycle works without stats (falls back to the fixed plan), but uses them when given.
    const hasStats = weight_kg != null || height_cm != null || age != null;
    if (prog.usesCalculator || hasStats) {
      const errors = validateStats({ sex, weight_kg, height_cm, age, activity_level, body_fat_pct });
      if (errors.length) return res.status(400).json({ error: errors.join(', ') });

      const computed = calcTargets({
        programme, sex, weight_kg, height_cm, age, activity_level, body_fat_pct,
        goal, goal_rate_kg_week, macro_preset,
      });
      if (!computed) return res.status(400).json({ error: 'Could not compute targets' });
      const { warnings: w, ...targets } = computed;
      warnings = w;

      await db.update(users).set({
        sex, age, height_cm, activity_level, body_fat_pct,
      }).where(eq(users.id, req.user.id)).run();

      Object.assign(updates, targets, {
        current_weight_kg: weight_kg,
        goal_weight_kg: goal_weight_kg ?? null,
      });
    }

    const existing = await db.select().from(appConfig).where(eq(appConfig.user_id, req.user.id)).get();
    if (existing) {
      await db.update(appConfig).set(updates).where(eq(appConfig.user_id, req.user.id)).run();
    } else {
      const today = new Date().toISOString().split('T')[0];
      await db.insert(appConfig).values({
        user_id: req.user.id,
        start_date: today,
        settings_json: '{}',
        ...updates,
      }).run();
    }

    const cfg = await db.select().from(appConfig).where(eq(appConfig.user_id, req.user.id)).get();
    res.json({ ok: true, config: cfg, warnings });
  } catch (err) { next(err); }
});

router.get('/me', async (req, res, next) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, req.user.id)).get();
    const cfg = await db.select().from(appConfig).where(eq(appConfig.user_id, req.user.id)).get();
    res.json({
      sex: user?.sex,
      age: user?.age,
      height_cm: user?.height_cm,
      activity_level: user?.activity_level,
      body_fat_pct: user?.body_fat_pct,
      goal: cfg?.goal,
      goal_rate_kg_week: cfg?.goal_rate_kg_week,
      macro_preset: cfg?.macro_preset,
      units: cfg?.units || 'metric',
      programme: cfg?.programme || 'carb_cycle',
      current_weight_kg: cfg?.current_weight_kg,
      goal_weight_kg: cfg?.goal_weight_kg,
      bmr: cfg?.bmr,
      tdee: cfg?.tdee,
      calorie_target: cfg?.calorie_target,
      protein_g_target: cfg?.protein_g_target,
      carbs_g_target: cfg?.carbs_g_target,
      fat_g_target: cfg?.fat_g_target,
    });
  } catch (err) { next(err); }
});

export default router;
