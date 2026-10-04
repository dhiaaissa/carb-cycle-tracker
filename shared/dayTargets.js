/**
 * Resolves the daily targets the app actually uses, from the user's profile,
 * programme, goal settings and manual overrides. Pure — shared by server and client.
 */
import { calcBMR, calcTDEE, calcCarbCycleTargets, calcPlan, GOALS, GOAL_RATES, MACRO_PRESETS } from './nutrition.js';

/** Legacy fixed carb-cycle plan — used only when the profile has no stats yet. */
export const DEFAULT_DAY_TARGETS = {
  low:  { calories: 1300, protein_g: 120, carbs_g: 95,  fat_g: 48 },
  med:  { calories: 1600, protein_g: 130, carbs_g: 150, fat_g: 55 },
  high: { calories: 1550, protein_g: 120, carbs_g: 155, fat_g: 52 },
  // Single daily target: macro programmes, and carb-cycle days outside the 56-day schedule.
  flat: { calories: 1600, protein_g: 130, carbs_g: 150, fat_g: 55 },
};

export const DAY_TYPES = Object.keys(DEFAULT_DAY_TARGETS);

export const WATER_GOALS = { low: 2.5, med: 3.0, high: 3.5, flat: 2.5 };

/** Default goal settings per programme — used until the user picks their own. */
export const PROGRAMME_GOALS = {
  carb_cycle:  { goal: 'lose', rateKgPerWeek: 0.5,  preset: 'balanced' },
  weight_loss: { goal: 'lose', rateKgPerWeek: 0.5,  preset: 'high_protein' },
  muscle_gain: { goal: 'gain', rateKgPerWeek: 0.25, preset: 'balanced' },
  recomp:      { goal: 'lose', rateKgPerWeek: 0.25, preset: 'high_protein' },
};

/** Map DB/API snake_case fields → the camelCase profile the engine expects. */
export function toProfile({ sex, age, height_cm, weight_kg, current_weight_kg, activity_level, body_fat_pct } = {}) {
  return {
    sex,
    age,
    heightCm: height_cm,
    weightKg: weight_kg ?? current_weight_kg,
    activity: activity_level,
    bodyFatPct: body_fat_pct ?? undefined,
  };
}

/**
 * User's goal settings, falling back field-by-field to the programme defaults.
 * Invalid stored values are ignored rather than trusted.
 * @param {string} programme
 * @param {{ goal?, goal_rate_kg_week?, macro_preset? }} [cfg]  snake_case config row
 */
export function goalSettingsFor(programme, cfg = {}) {
  const d = PROGRAMME_GOALS[programme] ?? PROGRAMME_GOALS.weight_loss;
  const goal = GOALS.includes(cfg?.goal) ? cfg.goal : d.goal;
  const rate = typeof cfg?.goal_rate_kg_week === 'number' && cfg.goal_rate_kg_week >= 0
    ? cfg.goal_rate_kg_week
    : (goal === d.goal ? d.rateKgPerWeek : GOAL_RATES[goal][Math.min(1, GOAL_RATES[goal].length - 1)]);
  const preset = MACRO_PRESETS[cfg?.macro_preset] ? cfg.macro_preset : d.preset;
  return { goal, rateKgPerWeek: goal === 'maintain' ? 0 : rate, preset };
}

/**
 * Plan for a programme. For carb_cycle, also returns per-day-type targets.
 * @returns {{ ok: false, errors } | { ok: true, ...plan, dayTargets? }}
 */
export function planForProgramme(programme, profile, goalSettings = goalSettingsFor(programme)) {
  const plan = calcPlan(profile, goalSettings);
  if (!plan.ok || programme !== 'carb_cycle') return plan;
  return { ...plan, dayTargets: calcCarbCycleTargets({ ...profile, tdee: plan.tdee, preset: goalSettings.preset }) };
}

const pickMacros = (o) => ({ calories: o.calories, protein_g: o.protein_g, carbs_g: o.carbs_g, fat_g: o.fat_g });

/**
 * Final targets for every day type.
 * Precedence per field: manual override → stored/derived → legacy default.
 *
 * @param {object} p
 * @param {string} [p.programme='carb_cycle']
 * @param {object} [p.profile]       camelCase profile (see toProfile)
 * @param {number} [p.tdee]          stored TDEE; recomputed from profile if absent
 * @param {object} [p.goalSettings]  see goalSettingsFor
 * @param {object} [p.overrides]     settings.calorie_targets: { low: { calories?, protein_g?, ... }, flat: {...} }
 * @param {object} [p.stored]        single target saved at setup: { calories, protein_g, carbs_g, fat_g }
 * @returns {{ low, med, high, flat, source: 'derived' | 'default' }}
 */
export function resolveDayTargets({ programme = 'carb_cycle', profile, tdee, goalSettings, overrides, stored } = {}) {
  const goals = goalSettings ?? goalSettingsFor(programme);
  const base = { ...DEFAULT_DAY_TARGETS };
  let source = 'default';

  if (profile) {
    let t = tdee;
    if (!(t > 0)) {
      const bmr = calcBMR(profile);
      t = bmr ? calcTDEE(bmr.value, profile.activity) : null;
    }
    const cycle = t > 0 ? calcCarbCycleTargets({ ...profile, tdee: t, preset: goals.preset }) : null;
    if (cycle) { Object.assign(base, cycle); source = 'derived'; }

    const plan = calcPlan(profile, goals);
    if (plan.ok) { base.flat = pickMacros(plan); source = 'derived'; }
  }

  // A target saved at setup (macro programmes) wins over recomputation, so the
  // numbers don't drift silently when the engine is tuned.
  if (programme !== 'carb_cycle' && stored?.calories > 0) {
    base.flat = { ...base.flat, ...Object.fromEntries(Object.entries(pickMacros(stored)).filter(([, v]) => v > 0)) };
    source = 'derived';
  }

  const out = { source };
  for (const type of DAY_TYPES) {
    const o = overrides?.[type] ?? {};
    const pick = (k) => (typeof o[k] === 'number' && o[k] > 0 ? o[k] : base[type][k]);
    out[type] = { calories: pick('calories'), protein_g: pick('protein_g'), carbs_g: pick('carbs_g'), fat_g: pick('fat_g') };
  }
  return out;
}
