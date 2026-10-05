import { Router } from 'express';
import { db } from '../db/index.js';
import { appConfig, users } from '../db/schema.js';
import { dayTargetsFor } from '../lib/targets.js';
import { getOrCreateConfig } from '../lib/userConfig.js';
import { resyncDayIndexes } from '../lib/dayLogs.js';
import { isIsoDate } from '../../shared/dates.js';
import { logEvent } from '../lib/audit.js';
import { eq, and } from 'drizzle-orm';
import { getDayType, getPhase, getTodayIndex, getPhaseGoal } from '../lib/schedule.js';

const router = Router();

const getUser = (id) => db.select().from(users).where(eq(users.id, id)).get();

const targetsPayload = (cfg, user) => ({
  day_targets: dayTargetsFor(cfg, user),
  day_targets_suggested: dayTargetsFor(cfg, user, { withOverrides: false }),
});

router.get('/', async (req, res, next) => {
  try {
    const config = await getOrCreateConfig(req.user.id);
    const todayIndex = getTodayIndex(config.start_date);
    const clamped = Math.max(0, Math.min(55, todayIndex));

    let settings = {};
    try { settings = JSON.parse(config.settings_json || '{}'); } catch {}

    res.json({
      start_date: config.start_date,
      today_index: todayIndex,
      today_day_type: todayIndex >= 0 && todayIndex <= 55 ? getDayType(clamped) : null,
      today_phase: todayIndex >= 0 && todayIndex <= 55 ? getPhase(clamped) : null,
      today_phase_goal: todayIndex >= 0 && todayIndex <= 55 ? getPhaseGoal(getPhase(clamped)) : null,
      settings,
      ...targetsPayload(config, await getUser(req.user.id)),
      programme: config.programme || 'carb_cycle',
      goal_weight_kg: config.goal_weight_kg,
      current_weight_kg: config.current_weight_kg,
      bmr: config.bmr,
      tdee: config.tdee,
      calorie_target: config.calorie_target,
      protein_g_target: config.protein_g_target,
      carbs_g_target: config.carbs_g_target,
      fat_g_target: config.fat_g_target,
      goal: config.goal,
      goal_rate_kg_week: config.goal_rate_kg_week,
      macro_preset: config.macro_preset,
      units: config.units || 'metric',
    });
  } catch (err) { next(err); }
});

router.put('/', async (req, res, next) => {
  try {
    const { start_date, settings } = req.body;
    const config = await getOrCreateConfig(req.user.id);

    const updates = {};
    if (start_date) { // Settings always sends it; empty means "unchanged"
      if (!isIsoDate(start_date)) return res.status(400).json({ error: 'start_date must be YYYY-MM-DD' });
      updates.start_date = start_date;
    }
    if (settings !== undefined) updates.settings_json = JSON.stringify(settings);

    if (Object.keys(updates).length > 0) {
      await db.update(appConfig).set(updates).where(eq(appConfig.user_id, req.user.id)).run();
    }
    // Logs stay on their calendar dates; only their position in the programme moves.
    if (updates.start_date && updates.start_date !== config.start_date) {
      await resyncDayIndexes(req.user.id, updates.start_date);
      await logEvent(req, { action: 'config.start_date', target: { type: 'user', id: req.user.id, label: req.user.username }, details: { from: config.start_date, to: updates.start_date } });
    }

    const updated = await db.select().from(appConfig).where(eq(appConfig.user_id, req.user.id)).get();
    let parsedSettings = {};
    try { parsedSettings = JSON.parse(updated.settings_json || '{}'); } catch {}

    const todayIndex = getTodayIndex(updated.start_date);
    const clamped = Math.max(0, Math.min(55, todayIndex));

    res.json({
      start_date: updated.start_date,
      today_index: todayIndex,
      today_day_type: todayIndex >= 0 && todayIndex <= 55 ? getDayType(clamped) : null,
      today_phase: todayIndex >= 0 && todayIndex <= 55 ? getPhase(clamped) : null,
      today_phase_goal: todayIndex >= 0 && todayIndex <= 55 ? getPhaseGoal(getPhase(clamped)) : null,
      settings: parsedSettings,
      ...targetsPayload(updated, await getUser(req.user.id)),
    });
  } catch (err) { next(err); }
});

export default router;
