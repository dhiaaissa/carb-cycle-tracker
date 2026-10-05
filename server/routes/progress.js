/**
 * Progress data: intake + weight series, smoothed trend weight, the adaptive
 * TDEE estimate (and accepting it), and weekly insights. Date-keyed, so it
 * works for every programme.
 */
import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { appConfig } from '../db/schema.js';
import { listDays } from '../lib/dayLogs.js';
import { loadUserContext } from '../lib/targets.js';
import { logEvent } from '../lib/audit.js';
import { trendWeights, estimateAdaptiveTDEE, calcCalorieTarget, calcMacros } from '../../shared/nutrition.js';
import { goalSettingsFor, toProfile, WATER_GOALS } from '../../shared/dayTargets.js';
import { weeklyInsights } from '../../shared/weeklyInsights.js';
import { addDays, isIsoDate } from '../../shared/dates.js';

const router = Router();

const DISMISS_DAYS = 7;   // "Not now" hides the suggestion for a week
const COOLDOWN_DAYS = 14; // after accepting, give the new target time to show results
const DAY_MS = 86_400_000;

const todayFrom = (q) => (isIsoDate(q) ? q : new Date().toISOString().slice(0, 10));
const readSettings = (cfg) => { try { return JSON.parse(cfg?.settings_json || '{}'); } catch { return {}; } };

/** Intake/weight series for a window. Unlogged days are excluded (not counted as 0 kcal). */
async function series(userId, today, days) {
  const from = addDays(today, -(days - 1));
  const logs = await listDays(userId, { from, to: today });
  return {
    from,
    logs,
    points: logs.map((l) => ({
      date: l.date,
      intakeKcal: l.calories_consumed > 0 ? Math.round(l.calories_consumed) : null,
      weightKg: l.weight_kg ?? null,
    })),
  };
}

/** Whether the adaptive card should be shown right now. */
function adaptiveState(adaptive, settings) {
  const now = Date.now();
  const dismissedAt = Date.parse(settings.adaptive?.dismissed_at || '') || 0;
  const acceptedAt = Date.parse(settings.adaptive?.accepted_at || '') || 0;
  const snoozed = now - dismissedAt < DISMISS_DAYS * DAY_MS;
  const cooling = now - acceptedAt < COOLDOWN_DAYS * DAY_MS;
  return {
    show: adaptive.status === 'ok' && adaptive.suggest && !snoozed && !cooling,
    accepted: settings.adaptive?.accepted_at ? { at: settings.adaptive.accepted_at, from: settings.adaptive.from, to: settings.adaptive.to } : null,
  };
}

/**
 * GET /progress?days=90&today=YYYY-MM-DD
 * `today` should be the client's local date (server runs in UTC).
 */
router.get('/', async (req, res, next) => {
  try {
    const today = todayFrom(req.query.today);
    const days = Math.min(365, Math.max(7, parseInt(req.query.days, 10) || 90));
    const [{ cfg }, s] = await Promise.all([loadUserContext(req.user.id), series(req.user.id, today, days)]);
    const adaptive = estimateAdaptiveTDEE(s.points, { formulaTdee: cfg?.tdee ?? undefined });
    res.json({
      from: s.from,
      to: today,
      series: s.points,
      trend: trendWeights(s.points),
      adaptive: { ...adaptive, ...adaptiveState(adaptive, readSettings(cfg)) },
    });
  } catch (err) { next(err); }
});

/**
 * POST /progress/adaptive/accept { today }
 * The server recomputes the estimate itself — the client never supplies the number.
 */
router.post('/adaptive/accept', async (req, res, next) => {
  try {
    const today = todayFrom(req.body?.today);
    const [{ cfg, user }, s] = await Promise.all([loadUserContext(req.user.id), series(req.user.id, today, 28)]);
    if (!cfg) return res.status(400).json({ error: 'No programme set up' });
    const adaptive = estimateAdaptiveTDEE(s.points, { formulaTdee: cfg.tdee ?? undefined });
    if (adaptive.status !== 'ok' || adaptive.confidence === 'low') {
      return res.status(409).json({ error: 'Not enough recent data for a reliable estimate yet' });
    }

    const settings = readSettings(cfg);
    const updates = { tdee: adaptive.tdee };
    const warnings = [];

    // Single-target programmes store their calorie/macro targets: recompute them
    // from the new TDEE with the user's own goal settings. Carb-cycle day targets
    // are derived from cfg.tdee at read time, so they follow automatically.
    if (cfg.programme && cfg.programme !== 'carb_cycle') {
      const profile = toProfile({ ...user, current_weight_kg: cfg.current_weight_kg });
      const goal = goalSettingsFor(cfg.programme, cfg);
      const target = calcCalorieTarget({ tdee: adaptive.tdee, goal: goal.goal, rateKgPerWeek: goal.rateKgPerWeek, sex: profile.sex, weightKg: profile.weightKg });
      const macros = target && calcMacros({ ...profile, calories: target.calories, preset: goal.preset });
      if (target && macros) {
        Object.assign(updates, {
          calorie_target: target.calories, protein_g_target: macros.protein_g, carbs_g_target: macros.carbs_g, fat_g_target: macros.fat_g,
        });
        warnings.push(...target.warnings, ...macros.warnings);
      }
    }

    settings.adaptive = { ...settings.adaptive, accepted_at: new Date().toISOString(), from: cfg.tdee ? Math.round(cfg.tdee) : null, to: adaptive.tdee };
    updates.settings_json = JSON.stringify(settings);
    await db.update(appConfig).set(updates).where(eq(appConfig.user_id, req.user.id)).run();
    await logEvent(req, {
      action: 'programme.adaptive_tdee',
      target: { type: 'user', id: req.user.id, label: req.user.username },
      details: { from: settings.adaptive.from, to: adaptive.tdee, confidence: adaptive.confidence, days: adaptive.spanDays },
    });
    res.json({ ok: true, tdee: adaptive.tdee, calorie_target: updates.calorie_target ?? null, warnings });
  } catch (err) { next(err); }
});

/** POST /progress/adaptive/dismiss — "not now", hides the card for a week. */
router.post('/adaptive/dismiss', async (req, res, next) => {
  try {
    const { cfg } = await loadUserContext(req.user.id);
    if (!cfg) return res.json({ ok: true });
    const settings = readSettings(cfg);
    settings.adaptive = { ...settings.adaptive, dismissed_at: new Date().toISOString() };
    await db.update(appConfig).set({ settings_json: JSON.stringify(settings) }).where(eq(appConfig.user_id, req.user.id)).run();
    res.json({ ok: true });
  } catch (err) { next(err); }
});

/** GET /progress/weekly?today=YYYY-MM-DD — insights for the 7 days before today. */
router.get('/weekly', async (req, res, next) => {
  try {
    const today = todayFrom(req.query.today);
    const [{ dayTargets }, logs] = await Promise.all([
      loadUserContext(req.user.id),
      listDays(req.user.id, { from: addDays(today, -7), to: addDays(today, -1) }),
    ]);
    res.json(weeklyInsights({ logs, today, targets: dayTargets, waterGoals: WATER_GOALS }));
  } catch (err) { next(err); }
});

export default router;
