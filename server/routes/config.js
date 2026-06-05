import { Router } from 'express';
import { db } from '../db/index.js';
import { appConfig } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { getDayType, getPhase, getTodayIndex, getPhaseGoal } from '../lib/schedule.js';

const router = Router();

// GET /api/config — returns start_date, today's day_index, day_type, phase
router.get('/', (req, res) => {
  const config = db.select().from(appConfig).where(eq(appConfig.id, 1)).get();
  if (!config) return res.status(500).json({ error: 'No config found. Run seed first.' });

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
});

// PUT /api/config — update settings
router.put('/', (req, res) => {
  const { start_date, settings } = req.body;
  const config = db.select().from(appConfig).where(eq(appConfig.id, 1)).get();
  if (!config) return res.status(500).json({ error: 'No config found.' });

  const updates = {};
  if (start_date) updates.start_date = start_date;
  if (settings !== undefined) updates.settings_json = JSON.stringify(settings);

  if (Object.keys(updates).length > 0) {
    db.update(appConfig).set(updates).where(eq(appConfig.id, 1)).run();
  }

  const updated = db.select().from(appConfig).where(eq(appConfig.id, 1)).get();
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
});

export default router;
