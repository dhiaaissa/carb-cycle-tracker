/**
 * Stats for free-form (non-carb-cycle) programmes.
 * Treats day_index as days-since-start_date, with no 56-day cap.
 * Used by weight_loss / muscle_gain / recomp dashboards.
 */
import { Router } from 'express';
import { db } from '../db/index.js';
import { dayLogs, appConfig } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';

const router = Router();

function daysSince(startDateStr) {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr + 'T00:00:00Z');
  const today = new Date();
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const utcStart = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  return Math.floor((utcToday - utcStart) / 86400000);
}

function dateForIndex(startDateStr, idx) {
  const d = new Date(startDateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + idx);
  return d.toISOString().split('T')[0];
}

router.get('/', async (req, res, next) => {
  try {
    const config = await db.select().from(appConfig).where(eq(appConfig.user_id, req.user.id)).get();
    if (!config) return res.status(500).json({ error: 'No config for user.' });

    const todayIndex = daysSince(config.start_date);
    const allLogs = await db.select().from(dayLogs)
      .where(eq(dayLogs.user_id, req.user.id))
      .orderBy(asc(dayLogs.day_index))
      .all();

    const logMap = new Map(allLogs.map(l => [l.day_index, l]));

    // Streak: consecutive days back from today with score >= 3
    let streak = 0;
    for (let i = todayIndex; i >= 0; i--) {
      const log = logMap.get(i);
      if (log && log.score >= 3) streak++;
      else break;
    }

    const total_completed = allLogs.length;
    const total_perfect = allLogs.filter(l => l.score === 5).length;

    const calTarget = config.calorie_target || 0;
    const avgCalories = allLogs.length
      ? Math.round(allLogs.reduce((s, l) => s + (l.calories_consumed || 0), 0) / allLogs.length)
      : 0;
    const avgProtein = allLogs.length
      ? Math.round(allLogs.reduce((s, l) => s + (l.protein_g || 0), 0) / allLogs.length)
      : 0;

    // Determine max week we should expose: at least the current week, plus any weeks with logs
    const maxLogWeek = allLogs.length
      ? Math.floor(allLogs[allLogs.length - 1].day_index / 7) + 1
      : 1;
    const currentWeek = Math.max(1, Math.floor(todayIndex / 7) + 1);
    const maxWeek = Math.max(maxLogWeek, currentWeek);

    const weekly_summary = [];
    for (let w = 1; w <= maxWeek; w++) {
      const wStart = (w - 1) * 7;
      const wEnd = w * 7 - 1;
      const weekLogs = [];
      for (let i = wStart; i <= wEnd; i++) {
        const log = logMap.get(i);
        if (log) weekLogs.push(log);
      }
      const avgCal = weekLogs.length
        ? Math.round(weekLogs.reduce((s, l) => s + (l.calories_consumed || 0), 0) / weekLogs.length)
        : 0;
      weekly_summary.push({
        week_number: w,
        completed_days: weekLogs.length,
        good_days: weekLogs.filter(l => l.score >= 3).length,
        perfect_days: weekLogs.filter(l => l.score === 5).length,
        workout_days: weekLogs.filter(l => l.workout_done).length,
        avg_calories: avgCal,
        start_date: dateForIndex(config.start_date, wStart),
        end_date: dateForIndex(config.start_date, wEnd),
      });
    }

    const weight_entries = allLogs
      .filter(l => l.weight_kg != null)
      .map(l => ({ day_index: l.day_index, date: dateForIndex(config.start_date, l.day_index), weight_kg: l.weight_kg }));

    const startWeight = config.current_weight_kg ?? (weight_entries[0]?.weight_kg ?? null);
    const latestWeight = weight_entries.length ? weight_entries[weight_entries.length - 1].weight_kg : null;
    const weight_change = (startWeight != null && latestWeight != null) ? +(latestWeight - startWeight).toFixed(1) : null;

    res.json({
      programme: config.programme,
      today_index: todayIndex,
      current_week: currentWeek,
      max_week: maxWeek,
      streak,
      total_completed,
      total_perfect,
      avg_calories: avgCalories,
      avg_protein: avgProtein,
      weekly_summary,
      weight_entries,
      start_weight: startWeight,
      latest_weight: latestWeight,
      weight_change,
      goal_weight: config.goal_weight_kg,
    });
  } catch (err) { next(err); }
});

router.get('/week/:week', async (req, res, next) => {
  try {
    const config = await db.select().from(appConfig).where(eq(appConfig.user_id, req.user.id)).get();
    if (!config) return res.status(500).json({ error: 'No config for user.' });

    const w = parseInt(req.params.week, 10);
    if (isNaN(w) || w < 1) return res.status(400).json({ error: 'invalid week' });

    const wStart = (w - 1) * 7;
    const wEnd = w * 7 - 1;

    const allLogs = await db.select().from(dayLogs)
      .where(eq(dayLogs.user_id, req.user.id))
      .all();
    const logMap = new Map(allLogs.map(l => [l.day_index, l]));

    const days = [];
    for (let i = wStart; i <= wEnd; i++) {
      days.push({
        day_index: i,
        date: dateForIndex(config.start_date, i),
        log: logMap.get(i) || null,
      });
    }

    res.json({ week_number: w, days });
  } catch (err) { next(err); }
});

export default router;
