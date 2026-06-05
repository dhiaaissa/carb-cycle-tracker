import { Router } from 'express';
import { db } from '../db/index.js';
import { dayLogs, appConfig } from '../db/schema.js';
import { eq, asc, and } from 'drizzle-orm';
import { getDayType, getWeek, getPhase, getTodayIndex, generateSchedule } from '../lib/schedule.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const config = await db.select().from(appConfig).where(eq(appConfig.user_id, req.user.id)).get();
    if (!config) return res.status(500).json({ error: 'No config for user.' });

    const todayIndex = getTodayIndex(config.start_date);
    const allLogs = await db.select().from(dayLogs)
      .where(eq(dayLogs.user_id, req.user.id))
      .orderBy(asc(dayLogs.day_index))
      .all();
    const schedule = generateSchedule(config.start_date);

    const logMap = new Map(allLogs.map(l => [l.day_index, l]));

    let streak = 0;
    for (let i = Math.min(todayIndex, 55); i >= 0; i--) {
      const log = logMap.get(i);
      if (log && log.score >= 3) {
        streak++;
      } else {
        break;
      }
    }

    const total_completed = allLogs.length;
    const total_perfect = allLogs.filter(l => l.score === 5).length;

    const weekly_summary = [];
    for (let w = 1; w <= 8; w++) {
      const weekStart = (w - 1) * 7;
      const weekEnd = w * 7 - 1;
      const weekPhase = getPhase(weekStart);
      const weekDays = schedule.slice(weekStart, weekEnd + 1);
      const medDaysInWeek = weekDays.filter(d => d.day_type === 'med').length;
      const weekLogs = [];
      for (let i = weekStart; i <= weekEnd; i++) {
        const log = logMap.get(i);
        if (log) weekLogs.push(log);
      }
      weekly_summary.push({
        week_number: w,
        phase: weekPhase,
        completed_days: weekLogs.length,
        good_days: weekLogs.filter(l => l.score >= 3).length,
        perfect_days: weekLogs.filter(l => l.score === 5).length,
        workout_days: weekLogs.filter(l => l.workout_done).length,
        workout_goal: medDaysInWeek,
        cheat_used: weekLogs.some(l => l.cheat_meal),
      });
    }

    const weight_entries = allLogs
      .filter(l => l.weight_kg != null)
      .map(l => ({ day_index: l.day_index, date: schedule[l.day_index]?.date, weight_kg: l.weight_kg }));

    const currentWeek = todayIndex >= 0 && todayIndex <= 55 ? getWeek(todayIndex) : null;
    let current_week_workouts = 0;
    let current_week_workout_goal = 0;
    if (currentWeek) {
      const cwStart = (currentWeek - 1) * 7;
      const cwEnd = currentWeek * 7 - 1;
      for (let i = cwStart; i <= Math.min(cwEnd, 55); i++) {
        if (getDayType(i) === 'med') current_week_workout_goal++;
        const log = logMap.get(i);
        if (log && log.workout_done) current_week_workouts++;
      }
    }

    res.json({
      streak, total_completed, total_perfect, weekly_summary, weight_entries,
      current_week_workouts, current_week_workout_goal,
    });
  } catch (err) { next(err); }
});

export default router;
