import { Router } from 'express';
import { db } from '../db/index.js';
import { dayLogs, appConfig } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { getTodayIndex, getDayType, getPhase, getPhaseGoal } from '../lib/schedule.js';
import { CALORIE_TARGETS, MACRO_TARGETS, WATER_GOALS } from '../lib/calories.js';
import { sendWhatsApp, isWhatsAppEnabled } from '../lib/whatsapp.js';

const router = Router();

// Track which reminders were sent today: "dayIndex-slotId" -> true
const sent = new Map();

/**
 * The 4 daily reminder slots — each has its own time and smart message builder.
 */
const SLOTS = [
  {
    id: 'morning',
    hour: 8,
    buildMessage: (ctx) => {
      const lines = [`☀️ *Good morning! Day ${ctx.dayNumber}/56*`];
      lines.push(`Today is a *${ctx.dayType.toUpperCase()} carb* day (Phase ${ctx.phase} — ${ctx.phaseGoal})`);
      lines.push('');
      lines.push(`🎯 Targets:`);
      lines.push(`• Calories: ${ctx.calorieTarget} kcal`);
      lines.push(`• Protein: ${ctx.macros.protein_g}g | Carbs: ${ctx.macros.carbs_g}g | Fat: ${ctx.macros.fat_g}g`);
      lines.push(`• Water: ${ctx.waterGoal}L`);
      if (ctx.isWorkoutDay) {
        lines.push('');
        lines.push(`💪 *Training day!* Don't skip your workout.`);
      }
      lines.push('');
      lines.push(`🍳 Time to log *breakfast* — start your day right!`);
      return lines.join('\n');
    },
  },
  {
    id: 'lunch',
    hour: 13,
    buildMessage: (ctx) => {
      const lines = [`🍽️ *Lunch time! Day ${ctx.dayNumber}/56*`];
      lines.push('');

      // What's been logged so far
      if (ctx.meal1Done) {
        lines.push(`✅ Breakfast logged (${ctx.consumed} / ${ctx.calorieTarget} kcal so far)`);
      } else {
        lines.push(`⚠️ Breakfast not logged yet!`);
      }

      const remaining = ctx.calorieTarget - ctx.consumed;
      lines.push(`🔢 *${remaining > 0 ? remaining : 0} kcal remaining* for the rest of the day`);
      lines.push('');
      lines.push(`💧 Water: ${ctx.waterLogged}/${ctx.waterGoal}L — ${ctx.waterLogged < ctx.waterGoal / 2 ? 'drink up! 🚰' : 'good pace!'}`);
      lines.push('');
      lines.push(`🥗 Log your *lunch* now!`);
      return lines.join('\n');
    },
  },
  {
    id: 'snack',
    hour: 17,
    buildMessage: (ctx) => {
      const lines = [`🥜 *Afternoon check-in — Day ${ctx.dayNumber}/56*`];
      lines.push('');

      const mealsLogged = [ctx.meal1Done, ctx.meal2Done].filter(Boolean).length;
      lines.push(`📊 Progress: ${mealsLogged}/4 meals logged`);
      lines.push(`🔥 ${ctx.consumed} / ${ctx.calorieTarget} kcal consumed`);
      lines.push(`💧 Water: ${ctx.waterLogged}/${ctx.waterGoal}L`);

      if (ctx.isWorkoutDay && !ctx.workoutDone) {
        lines.push('');
        lines.push(`🏋️ *Reminder: you haven't logged your workout yet!*`);
      } else if (ctx.workoutDone) {
        lines.push(`✅ Workout done — great job!`);
      }

      const remaining = ctx.calorieTarget - ctx.consumed;
      if (remaining > 400) {
        lines.push('');
        lines.push(`⚡ You still have *${remaining} kcal* left — grab a snack and log it!`);
      } else if (remaining > 0) {
        lines.push('');
        lines.push(`👍 Almost on target — *${remaining} kcal* left for dinner.`);
      }

      if (!ctx.meal3Done) {
        lines.push('');
        lines.push(`🍎 Don't forget to log your *snack*!`);
      }
      return lines.join('\n');
    },
  },
  {
    id: 'evening',
    hour: 21,
    buildMessage: (ctx) => {
      const lines = [`🌙 *Evening wrap-up — Day ${ctx.dayNumber}/56*`];
      lines.push('');

      const mealsLogged = [ctx.meal1Done, ctx.meal2Done, ctx.meal3Done, ctx.meal4Done].filter(Boolean).length;
      const missing = [];
      if (!ctx.meal1Done) missing.push('Breakfast');
      if (!ctx.meal2Done) missing.push('Lunch');
      if (!ctx.meal3Done) missing.push('Snack');
      if (!ctx.meal4Done) missing.push('Dinner');

      if (mealsLogged === 4) {
        lines.push(`✅ All 4 meals logged!`);
      } else {
        lines.push(`⚠️ *${missing.length} meal${missing.length > 1 ? 's' : ''} missing:* ${missing.join(', ')}`);
        lines.push(`Log them before bed!`);
      }

      lines.push('');
      lines.push(`📊 *Day summary:*`);
      lines.push(`• Calories: ${ctx.consumed} / ${ctx.calorieTarget} kcal`);
      lines.push(`• Protein: ${ctx.proteinConsumed}g / ${ctx.macros.protein_g}g`);

      const waterOk = ctx.waterLogged >= ctx.waterGoal;
      lines.push(`• Water: ${ctx.waterLogged}/${ctx.waterGoal}L ${waterOk ? '✅' : '— drink more! 🚰'}`);

      if (ctx.isWorkoutDay) {
        lines.push(`• Workout: ${ctx.workoutDone ? '✅ Done' : '❌ Not logged'}`);
      }

      // Score
      lines.push('');
      const score = mealsLogged + (waterOk ? 1 : 0);
      if (score === 5) {
        lines.push(`⭐ *Perfect day! Score: 5/5* — keep it up!`);
      } else if (score >= 3) {
        lines.push(`👍 *Good day! Score: ${score}/5*`);
      } else {
        lines.push(`💪 *Score: ${score}/5* — tomorrow is a new chance!`);
      }

      return lines.join('\n');
    },
  },
];

/** Get today's full context for building messages */
function getTodayContext() {
  const cfg = db.select().from(appConfig).get();
  if (!cfg || !cfg.start_date) return null;

  const todayIndex = getTodayIndex(cfg.start_date);
  if (todayIndex < 0 || todayIndex > 55) return null;

  const dayType = getDayType(todayIndex);
  const phase = getPhase(todayIndex);
  const row = db.select().from(dayLogs).where(eq(dayLogs.day_index, todayIndex)).get();

  let meals_json = {};
  if (row) {
    try { meals_json = JSON.parse(row.meals_json || '{}'); } catch {}
  }

  return {
    todayIndex,
    dayNumber: todayIndex + 1,
    dayType,
    phase,
    phaseGoal: getPhaseGoal(phase),
    calorieTarget: CALORIE_TARGETS[dayType] || 1400,
    macros: MACRO_TARGETS[dayType] || MACRO_TARGETS.low,
    waterGoal: WATER_GOALS[dayType] || 2.5,
    isWorkoutDay: dayType === 'med',
    consumed: row?.calories_consumed || 0,
    proteinConsumed: row?.protein_g || 0,
    waterLogged: row?.water_liters || 0,
    workoutDone: row?.workout_done || false,
    meal1Done: row?.meal1_done || false,
    meal2Done: row?.meal2_done || false,
    meal3Done: row?.meal3_done || false,
    meal4Done: row?.meal4_done || false,
  };
}

// ── Reminder loop ───────────────────────────────────────────────────
let reminderInterval = null;

function checkAndSend() {
  const ctx = getTodayContext();
  if (!ctx) return;

  const hour = new Date().getHours();

  for (const slot of SLOTS) {
    // Send if we're past the slot hour and haven't sent it yet today
    const key = `${ctx.todayIndex}-${slot.id}`;
    if (hour >= slot.hour && !sent.has(key)) {
      const message = slot.buildMessage(ctx);
      sendWhatsApp(message)
        .then(() => {
          sent.set(key, true);
          console.log(`[Reminder] ✅ Sent "${slot.id}" for day ${ctx.dayNumber}`);
        })
        .catch(err => {
          console.error(`[Reminder] ❌ Failed "${slot.id}":`, err.message);
        });
    }
  }
}

// ── Routes ──────────────────────────────────────────────────────────

router.get('/status', (req, res) => {
  const ctx = getTodayContext();
  if (!ctx) return res.json({ active: false });

  const hour = new Date().getHours();
  const sentToday = SLOTS.filter(s => sent.has(`${ctx.todayIndex}-${s.id}`)).map(s => s.id);
  const nextSlot = SLOTS.find(s => hour < s.hour && !sent.has(`${ctx.todayIndex}-${s.id}`));

  res.json({
    active: true,
    running: !!reminderInterval,
    ...ctx,
    sent_today: sentToday,
    next_reminder: nextSlot ? { id: nextSlot.id, hour: nextSlot.hour } : null,
  });
});

router.post('/send', async (req, res) => {
  if (!isWhatsAppEnabled) {
    return res.json({ sent: false, disabled: true, reason: 'WhatsApp reminders are disabled in this deployment.' });
  }
  const ctx = getTodayContext();
  if (!ctx) return res.json({ sent: false, reason: 'Programme not active' });

  // Send whichever slot is due, or force the next one
  const hour = new Date().getHours();
  const slot = SLOTS.find(s => hour >= s.hour && !sent.has(`${ctx.todayIndex}-${s.id}`))
             || SLOTS.find(s => !sent.has(`${ctx.todayIndex}-${s.id}`));

  if (!slot) return res.json({ sent: false, reason: 'All reminders already sent today' });

  try {
    const message = slot.buildMessage(ctx);
    await sendWhatsApp(message);
    sent.set(`${ctx.todayIndex}-${slot.id}`, true);
    res.json({ sent: true, slot: slot.id, message });
  } catch (err) {
    res.status(500).json({ sent: false, error: err.message });
  }
});

router.post('/start', (req, res) => {
  if (!isWhatsAppEnabled) {
    return res.json({ running: false, disabled: true, message: 'WhatsApp reminders are disabled in this deployment.' });
  }
  if (reminderInterval) {
    return res.json({ running: true, message: 'Already running' });
  }

  // Check every 5 minutes
  reminderInterval = setInterval(checkAndSend, 5 * 60 * 1000);

  // Send immediately whatever is due
  checkAndSend();

  res.json({
    running: true,
    message: 'WhatsApp reminders active! You will receive 4 messages daily.',
    schedule: SLOTS.map(s => ({ id: s.id, hour: `${s.hour}:00` })),
  });
});

router.post('/stop', (req, res) => {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
  res.json({ running: false, message: 'Reminders stopped' });
});

router.get('/config', (req, res) => {
  res.json({
    running: !!reminderInterval,
    schedule: SLOTS.map(s => ({ id: s.id, hour: s.hour, label: s.id })),
  });
});

export default router;
