/**
 * Resolves the daily targets the app actually uses, from the user's profile,
 * programme and manual overrides. Pure — shared by server and client.
 */
import { calcBMR, calcTDEE, calcCarbCycleTargets, calcPlan } from './nutrition.js';

/** Legacy fixed carb-cycle plan — used only when the profile has no stats yet. */
export const DEFAULT_DAY_TARGETS = {
  low:  { calories: 1300, protein_g: 120, carbs_g: 95,  fat_g: 48 },
  med:  { calories: 1600, protein_g: 130, carbs_g: 150, fat_g: 55 },
  high: { calories: 1550, protein_g: 120, carbs_g: 155, fat_g: 52 },
};

export const WATER_GOALS = { low: 2.5, med: 3.0, high: 3.5 };

/** How each programme maps onto the goal/rate/preset model. */
export const PROGRAMME_GOALS = {
  carb_cycle:  { goal: 'lose',     rateKgPerWeek: 0.5,  preset: 'balanced' },
  weight_loss: { goal: 'lose',     rateKgPerWeek: 0.5,  preset: 'high_protein' },
  muscle_gain: { goal: 'gain',     rateKgPerWeek: 0.25, preset: 'balanced' },
  recomp:      { goal: 'lose',     rateKgPerWeek: 0.25, preset: 'high_protein' },
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
 * Plan for a programme. For carb_cycle, also returns per-day-type targets.
 * @returns {{ ok: false, errors } | { ok: true, ...plan, dayTargets? }}
 */
export function planForProgramme(programme, profile) {
  const goal = PROGRAMME_GOALS[programme] ?? PROGRAMME_GOALS.weight_loss;
  const plan = calcPlan(profile, goal);
  if (!plan.ok || programme !== 'carb_cycle') return plan;
  return { ...plan, dayTargets: calcCarbCycleTargets({ ...profile, tdee: plan.tdee, preset: goal.preset }) };
}

/**
 * Final per-day-type targets for carb cycling.
 * Precedence per field: manual override → derived from TDEE → legacy default.
 *
 * @param {object} p
 * @param {object} [p.profile]    camelCase profile (see toProfile)
 * @param {number} [p.tdee]       stored TDEE; recomputed from profile if absent
 * @param {object} [p.overrides]  settings.calorie_targets: { low: { calories?, protein_g?, ... } }
 * @returns {{ low, med, high, source: 'derived' | 'default' }}
 */
export function resolveDayTargets({ profile, tdee, overrides } = {}) {
  let base = DEFAULT_DAY_TARGETS;
  let source = 'default';

  if (profile) {
    let t = tdee;
    if (!(t > 0)) {
      const bmr = calcBMR(profile);
      t = bmr ? calcTDEE(bmr.value, profile.activity) : null;
    }
    const derived = t > 0 ? calcCarbCycleTargets({ ...profile, tdee: t, preset: PROGRAMME_GOALS.carb_cycle.preset }) : null;
    if (derived) { base = derived; source = 'derived'; }
  }

  const out = { source };
  for (const type of Object.keys(DEFAULT_DAY_TARGETS)) {
    const o = overrides?.[type] ?? {};
    const pick = (k) => (typeof o[k] === 'number' && o[k] > 0 ? o[k] : base[type][k]);
    out[type] = { calories: pick('calories'), protein_g: pick('protein_g'), carbs_g: pick('carbs_g'), fat_g: pick('fat_g') };
  }
  return out;
}
