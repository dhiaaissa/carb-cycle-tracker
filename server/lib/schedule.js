/**
 * Day type and phase computation for 56-day carb cycling programme.
 * All day indices are 0-based (0–55).
 */

/**
 * Returns the phase (1–4) for a given day index.
 */
export function getPhase(dayIndex) {
  if (dayIndex < 0 || dayIndex > 55) throw new Error(`Invalid day index: ${dayIndex}`);
  if (dayIndex <= 13) return 1;
  if (dayIndex <= 27) return 2;
  if (dayIndex <= 41) return 3;
  return 4;
}

/**
 * Returns the day type ('low' | 'med' | 'high') for a given day index.
 */
export function getDayType(dayIndex) {
  if (dayIndex < 0 || dayIndex > 55) throw new Error(`Invalid day index: ${dayIndex}`);

  // Phase 1 — Days 0–13: alternate Med / Low starting with Med
  if (dayIndex <= 13) {
    return dayIndex % 2 === 0 ? 'med' : 'low';
  }

  // Phase 2 — Days 14–27: 3× Low then 1× Med, repeat
  if (dayIndex <= 27) {
    const offset = dayIndex - 14;
    return offset % 4 === 3 ? 'med' : 'low';
  }

  // Phase 3 — Days 28–41: 6× Low then 1× Med, repeat
  if (dayIndex <= 41) {
    const offset = dayIndex - 28;
    return offset % 7 === 6 ? 'med' : 'low';
  }

  // Phase 4 Week 7 — Days 42–48: High → Med → Low, repeat (last day is Med)
  if (dayIndex <= 48) {
    const offset = dayIndex - 42;
    // Day 42=H, 43=M, 44=L, 45=H, 46=M, 47=L, 48=M
    if (dayIndex === 48) return 'med';
    const pos = offset % 3;
    if (pos === 0) return 'high';
    if (pos === 1) return 'med';
    return 'low';
  }

  // Phase 4 Week 8 — Days 49–55: alternate Med / Low starting with Med
  const offset = dayIndex - 49;
  return offset % 2 === 0 ? 'med' : 'low';
}

/**
 * Returns the week number (1–8) for a given day index.
 */
export function getWeek(dayIndex) {
  return Math.floor(dayIndex / 7) + 1;
}

/**
 * Returns the phase goal text.
 */
export function getPhaseGoal(phase) {
  const goals = {
    1: 'Adaptation',
    2: 'Fat loss increase',
    3: 'Strong fat burning',
    4: 'Metabolic recovery & Performance',
  };
  return goals[phase];
}

/**
 * Generates the full 56-day schedule from a start date.
 * @param {string} startDate — ISO date string (YYYY-MM-DD)
 * @returns {Array<{day_index, date, day_type, phase, week, is_workout_day, phase_goal}>}
 */
export function generateSchedule(startDate) {
  const schedule = [];

  for (let i = 0; i < 56; i++) {
    const date = addDays(startDate, i);
    const dayType = getDayType(i);

    schedule.push({
      day_index: i,
      date,
      day_type: dayType,
      phase: getPhase(i),
      week: getWeek(i),
      is_workout_day: dayType === 'med',
      phase_goal: getPhaseGoal(getPhase(i)),
    });
  }

  return schedule;
}

/**
 * Adds days to a YYYY-MM-DD string, returns YYYY-MM-DD. Timezone-safe.
 */
export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().split('T')[0];
}

/**
 * Computes today's day index from a start date. Returns -1 if before start, 56+ if past end.
 */
export function getTodayIndex(startDate) {
  const [y, m, d] = startDate.split('-').map(Number);
  const start = Date.UTC(y, m - 1, d);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today - start) / (1000 * 60 * 60 * 24));
}
