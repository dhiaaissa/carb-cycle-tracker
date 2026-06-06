import { Router } from 'express';
import { db } from '../db/index.js';
import { appConfig, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { calcTargets, validateStats, PROGRAMMES } from '../lib/nutrition.js';

const router = Router();

router.get('/options', (_req, res) => {
  res.json({ programmes: PROGRAMMES });
});

router.post('/setup', async (req, res, next) => {
  try {
    const { programme, sex, age, height_cm, weight_kg, activity_level, goal_weight_kg } = req.body || {};

    if (!PROGRAMMES[programme]) {
      return res.status(400).json({ error: 'Unknown programme' });
    }

    const prog = PROGRAMMES[programme];

    const updates = { programme };

    if (prog.usesCalculator) {
      const errors = validateStats({ sex, weight_kg, height_cm, age, activity_level });
      if (errors.length) return res.status(400).json({ error: errors.join(', ') });

      const targets = calcTargets({ programme, sex, weight_kg, height_cm, age, activity_level });
      if (!targets) return res.status(400).json({ error: 'Could not compute targets' });

      await db.update(users).set({
        sex, age, height_cm, activity_level,
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
    res.json({ ok: true, config: cfg });
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
