import { Router } from 'express';
import { db } from '../db/index.js';
import { appConfig } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getDayType, getPhase, getTodayIndex, getPhaseGoal } from '../lib/schedule.js';

const router = Router();

async function getOrCreateConfig(userId) {
  let cfg = await db.select().from(appConfig).where(eq(appConfig.user_id, userId)).get();
  if (!cfg) {
    const today = new Date().toISOString().split('T')[0];
    await db.insert(appConfig).values({
      user_id: userId,
      start_date: today,
      settings_json: '{}',
    }).run();
    cfg = await db.select().from(appConfig).where(eq(appConfig.user_id, userId)).get();
  }
  return cfg;
}

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
    });
  } catch (err) { next(err); }
});

router.put('/', async (req, res, next) => {
  try {
    const { start_date, settings } = req.body;
    const config = await getOrCreateConfig(req.user.id);

    const updates = {};
    if (start_date) updates.start_date = start_date;
    if (settings !== undefined) updates.settings_json = JSON.stringify(settings);

    if (Object.keys(updates).length > 0) {
      await db.update(appConfig).set(updates).where(eq(appConfig.user_id, req.user.id)).run();
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
    });
  } catch (err) { next(err); }
});

export default router;
