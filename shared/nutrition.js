/**
 * Nutrition engine — the single source of truth for every calorie & macro number
 * shown in the app. Pure functions only: no I/O, no Date.now(), no globals.
 * Imported by both the Express server and the Vite client.
 *
 * Conventions:
 *   - All inputs/outputs are metric (kg, cm, kcal, grams). Convert at the edges
 *     with the unit helpers below.
 *   - Functions return `null` when required data is missing rather than throwing,
 *     so UI code can render "—" without try/catch.
 *   - Warnings are returned as `{ code, ...params }` so the client can translate
 *     them (en/fr/ar) instead of the server baking in English strings.
 */

// ── Constants ──────────────────────────────────────────────────────────

/** Energy in 1 kg of body-weight change (mixed fat/lean tissue). */
export const KCAL_PER_KG = 7700;

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 };

/** Absolute daily intake floors. Below these, micronutrient needs are hard to meet. */
export const MIN_CALORIES = { male: 1500, female: 1200 };

/** A deficit larger than this fraction of TDEE is capped. */
export const MAX_DEFICIT_PCT = 0.25;

/** Weekly loss faster than this fraction of body weight is capped. */
export const MAX_LOSS_PCT_BODYWEIGHT = 0.01;

export const ACTIVITY_LEVELS = {
  sedentary: { factor: 1.2,   description: 'Desk job, little or no exercise, under ~5k steps/day' },
  light:     { factor: 1.375, description: 'Light exercise 1–3 days/week, or on your feet part of the day' },
  moderate:  { factor: 1.55,  description: 'Exercise 3–5 days/week, or ~8–10k steps/day' },
  very:      { factor: 1.725, description: 'Hard training 6–7 days/week, or a physically active job' },
  extreme:   { factor: 1.9,   description: 'Physical labour job plus training, or twice-a-day sessions' },
};

export const GOALS = ['lose', 'maintain', 'gain'];

/** Selectable rates (kg/week). Gain is slower because lean gain is slow. */
export const GOAL_RATES = {
  lose: [0.25, 0.5, 0.75, 1.0],
  maintain: [0],
  gain: [0.1, 0.25, 0.5],
};

/**
 * Macro presets.
 *   proteinPerKg — grams per kg of protein reference weight
 *   fatMinPct    — fat gets at least this share of calories
 *   carbMaxPct   — optional cap on carbs; overflow goes to fat
 */
export const MACRO_PRESETS = {
  balanced:     { proteinPerKg: 1.6, fatMinPct: 0.30 },
  high_protein: { proteinPerKg: 2.2, fatMinPct: 0.25 },
  low_carb:     { proteinPerKg: 1.8, fatMinPct: 0.35, carbMaxPct: 0.20 },
};

/** Absolute floor for fat — below ~20% of kcal, hormonal health suffers. */
const FAT_FLOOR_PCT = 0.20;

/**
 * Carb-cycle day types as fractions of TDEE. Ratios mirror the original fixed
 * plan (1300 / 1600 / 1550) so the programme feels the same, but scale to the user.
 */
export const CARB_CYCLE_FACTORS = { low: 0.72, med: 0.88, high: 0.85 };

/** Low days cap carbs (overflow → fat) so they're genuinely low-carb, not just low-calorie. */
export const CARB_CYCLE_CARB_CAP = { low: 0.20 };

// ── Units ──────────────────────────────────────────────────────────────

const LB_PER_KG = 2.2046226218;
const CM_PER_IN = 2.54;

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const round = (v, dp = 0) => { const m = 10 ** dp; return Math.round(v * m) / m; };

export function lbToKg(lb) { return isNum(lb) ? lb / LB_PER_KG : null; }
export function kgToLb(kg) { return isNum(kg) ? kg * LB_PER_KG : null; }

export function ftInToCm(ft, inches = 0) {
  if (!isNum(ft) || !isNum(inches)) return null;
  return (ft * 12 + inches) * CM_PER_IN;
}

/** → { ft, in } with inches rounded to 1 dp; rolls 12in over into the next foot. */
export function cmToFtIn(cm) {
  if (!isNum(cm)) return null;
  const totalIn = cm / CM_PER_IN;
  let ft = Math.floor(totalIn / 12);
  let inches = round(totalIn - ft * 12, 1);
  if (inches >= 12) { ft += 1; inches = 0; }
  return { ft, in: inches };
}

// ── Validation ─────────────────────────────────────────────────────────

export const PROFILE_LIMITS = {
  age: [13, 100],
  weightKg: [30, 300],
  heightCm: [100, 250],
  bodyFatPct: [3, 60],
};

/** Returns an array of error codes (empty = valid). bodyFatPct is optional. */
export function validateProfile({ sex, age, weightKg, heightCm, activity, bodyFatPct } = {}) {
  const errors = [];
  const inRange = (v, [lo, hi]) => isNum(v) && v >= lo && v <= hi;
  if (sex !== 'male' && sex !== 'female') errors.push('sex');
  if (!inRange(age, PROFILE_LIMITS.age)) errors.push('age');
  if (!inRange(weightKg, PROFILE_LIMITS.weightKg)) errors.push('weight');
  if (!inRange(heightCm, PROFILE_LIMITS.heightCm)) errors.push('height');
  if (!ACTIVITY_LEVELS[activity]) errors.push('activity');
  if (bodyFatPct != null && !inRange(bodyFatPct, PROFILE_LIMITS.bodyFatPct)) errors.push('bodyFat');
  return errors;
}

// ── BMR / TDEE ─────────────────────────────────────────────────────────

export function bmrMifflin({ sex, weightKg, heightCm, age }) {
  if (!isNum(weightKg) || !isNum(heightCm) || !isNum(age)) return null;
  if (sex !== 'male' && sex !== 'female') return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function bmrKatchMcArdle({ weightKg, bodyFatPct }) {
  if (!isNum(weightKg) || !isNum(bodyFatPct) || bodyFatPct <= 0 || bodyFatPct >= 100) return null;
  const leanKg = weightKg * (1 - bodyFatPct / 100);
  return 370 + 21.6 * leanKg;
}

/**
 * Picks the best formula for the data available.
 * Katch-McArdle when body fat is known (more accurate for lean/muscular or
 * high-body-fat users), otherwise Mifflin-St Jeor.
 * @returns {{ value: number, method: 'katch' | 'mifflin' } | null}
 */
export function calcBMR(profile) {
  const katch = bmrKatchMcArdle(profile);
  if (katch != null) return { value: katch, method: 'katch' };
  const mifflin = bmrMifflin(profile);
  return mifflin != null ? { value: mifflin, method: 'mifflin' } : null;
}

export function calcTDEE(bmr, activity) {
  if (!isNum(bmr)) return null;
  const level = ACTIVITY_LEVELS[activity];
  return level ? bmr * level.factor : null;
}

// ── Goal → calorie target, with guardrails ─────────────────────────────

/**
 * Converts a goal + weekly rate into a daily calorie target, applying safety caps.
 *
 * @param {object} p
 * @param {number} p.tdee
 * @param {'lose'|'maintain'|'gain'} p.goal
 * @param {number} [p.rateKgPerWeek] — positive number; direction comes from `goal`
 * @param {'male'|'female'} p.sex
 * @param {number} p.weightKg
 * @returns {{ calories, dailyDelta, effectiveRate, warnings } | null}
 */
export function calcCalorieTarget({ tdee, goal = 'maintain', rateKgPerWeek = 0, sex, weightKg }) {
  if (!isNum(tdee) || tdee <= 0) return null;
  if (!GOALS.includes(goal)) return null;

  const warnings = [];
  let rate = goal === 'maintain' ? 0 : Math.abs(isNum(rateKgPerWeek) ? rateKgPerWeek : 0);

  if (goal === 'lose' && isNum(weightKg)) {
    const maxRate = weightKg * MAX_LOSS_PCT_BODYWEIGHT;
    if (rate > maxRate) {
      warnings.push({ code: 'rate_capped_bodyweight', requested: rate, applied: round(maxRate, 2) });
      rate = maxRate;
    }
  }
  if (goal === 'gain' && rate > 0.5) {
    warnings.push({ code: 'gain_rate_capped', requested: rate, applied: 0.5 });
    rate = 0.5;
  }

  const sign = goal === 'lose' ? -1 : goal === 'gain' ? 1 : 0;
  let delta = sign * (rate * KCAL_PER_KG) / 7;

  if (delta < -tdee * MAX_DEFICIT_PCT) {
    warnings.push({ code: 'deficit_capped', maxPct: MAX_DEFICIT_PCT * 100 });
    delta = -tdee * MAX_DEFICIT_PCT;
  }

  let calories = tdee + delta;
  const floor = MIN_CALORIES[sex] ?? MIN_CALORIES.female;
  if (calories < floor) {
    warnings.push({ code: 'below_minimum', floor });
    calories = Math.min(floor, tdee); // never push a small person *above* maintenance to hit the floor
    delta = calories - tdee;
  }

  return {
    calories: round(calories),
    dailyDelta: round(delta),
    effectiveRate: round(Math.abs(delta) * 7 / KCAL_PER_KG, 2),
    warnings,
  };
}

// ── Macros ─────────────────────────────────────────────────────────────

/**
 * Weight used for protein g/kg. For high BMI, g/kg of total weight overshoots
 * badly (120 kg × 2 g = 240 g), so cap at the weight corresponding to BMI 27.5.
 * With body fat known, use lean mass scaled back to an equivalent total weight.
 */
export function proteinReferenceKg({ weightKg, heightCm, bodyFatPct }) {
  if (!isNum(weightKg)) return null;
  if (isNum(bodyFatPct) && bodyFatPct > 0 && bodyFatPct < 100) {
    const lean = weightKg * (1 - bodyFatPct / 100);
    return Math.min(weightKg, lean / 0.8); // ≈ weight at 20% body fat
  }
  if (isNum(heightCm)) {
    const m = heightCm / 100;
    return Math.min(weightKg, 27.5 * m * m);
  }
  return weightKg;
}

/**
 * Protein from body weight, fat from a minimum share of calories, carbs fill the rest.
 * If protein + fat would exceed calories (tiny targets), fat drops to its floor
 * first, then protein shrinks — carbs never go negative.
 *
 * @returns {{ protein_g, fat_g, carbs_g, warnings } | null}
 */
export function calcMacros({ calories, weightKg, heightCm, bodyFatPct, preset = 'balanced' }) {
  if (!isNum(calories) || calories <= 0 || !isNum(weightKg)) return null;
  // `preset` is a preset name, or a preset-shaped object for one-off variations.
  const p = typeof preset === 'object' && preset ? preset : (MACRO_PRESETS[preset] ?? MACRO_PRESETS.balanced);
  const warnings = [];

  const refKg = proteinReferenceKg({ weightKg, heightCm, bodyFatPct });
  let proteinKcal = p.proteinPerKg * refKg * KCAL_PER_G.protein;
  let fatKcal = calories * p.fatMinPct;

  if (proteinKcal + fatKcal > calories) {
    fatKcal = Math.max(calories * FAT_FLOOR_PCT, calories - proteinKcal);
    if (proteinKcal + fatKcal > calories) {
      proteinKcal = calories - fatKcal;
      warnings.push({ code: 'protein_reduced' });
    }
  }

  let carbKcal = calories - proteinKcal - fatKcal;
  if (p.carbMaxPct != null && carbKcal > calories * p.carbMaxPct) {
    fatKcal += carbKcal - calories * p.carbMaxPct;
    carbKcal = calories * p.carbMaxPct;
  }

  return {
    protein_g: round(proteinKcal / KCAL_PER_G.protein),
    fat_g: round(fatKcal / KCAL_PER_G.fat),
    carbs_g: round(Math.max(0, carbKcal) / KCAL_PER_G.carbs),
    warnings,
  };
}

// ── Full plan ──────────────────────────────────────────────────────────

/**
 * One-shot: profile + goal → everything the UI needs.
 *
 * @param {object} profile  { sex, age, weightKg, heightCm, activity, bodyFatPct? }
 * @param {object} goal     { goal, rateKgPerWeek, preset }
 * @returns {{ ok: false, errors: string[] } | { ok: true, bmr, bmrMethod, tdee, calories, ... }}
 */
export function calcPlan(profile, { goal = 'maintain', rateKgPerWeek = 0, preset = 'balanced' } = {}) {
  const errors = validateProfile(profile);
  if (errors.length) return { ok: false, errors };

  const bmr = calcBMR(profile);
  const tdee = calcTDEE(bmr.value, profile.activity);
  const target = calcCalorieTarget({ tdee, goal, rateKgPerWeek, sex: profile.sex, weightKg: profile.weightKg });
  const macros = calcMacros({ ...profile, calories: target.calories, preset });

  return {
    ok: true,
    bmr: round(bmr.value),
    bmrMethod: bmr.method,
    tdee: round(tdee),
    calories: target.calories,
    dailyDelta: target.dailyDelta,
    effectiveRate: target.effectiveRate,
    protein_g: macros.protein_g,
    carbs_g: macros.carbs_g,
    fat_g: macros.fat_g,
    warnings: [...target.warnings, ...macros.warnings],
  };
}

/**
 * Carb-cycle targets per day type, derived from TDEE. Each day type gets the
 * same protein; carbs flex with calories and are capped on low days.
 * Every day respects the safety floor.
 *
 * @returns {{ low, med, high } each { calories, protein_g, carbs_g, fat_g } | null}
 */
export function calcCarbCycleTargets({ tdee, sex, weightKg, heightCm, bodyFatPct, preset = 'balanced' }) {
  if (!isNum(tdee) || !isNum(weightKg)) return null;
  const floor = MIN_CALORIES[sex] ?? MIN_CALORIES.female;
  const base = MACRO_PRESETS[preset] ?? MACRO_PRESETS.balanced;
  const out = {};
  for (const [type, factor] of Object.entries(CARB_CYCLE_FACTORS)) {
    const calories = round(Math.max(Math.min(floor, tdee), tdee * factor));
    const cap = CARB_CYCLE_CARB_CAP[type];
    const dayPreset = cap != null ? { ...base, carbMaxPct: Math.min(cap, base.carbMaxPct ?? 1) } : base;
    const { warnings, ...m } = calcMacros({ calories, weightKg, heightCm, bodyFatPct, preset: dayPreset });
    out[type] = { calories, ...m };
  }
  return out;
}

// ── Trend weight & adaptive TDEE ───────────────────────────────────────

const DAY_MS = 86_400_000;
const toDayNumber = (iso) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / DAY_MS);

/**
 * Trailing moving average of weight by calendar day. Missing days are skipped
 * (the window is by date, not by entry count), so gaps don't distort the line.
 *
 * @param {{ date: string, weightKg: number|null }[]} entries  ISO dates
 * @returns {{ date: string, weightKg: number, trendKg: number }[]}  only days with a weigh-in
 */
export function trendWeights(entries, windowDays = 7) {
  const pts = (entries ?? [])
    .filter((e) => e && isNum(e.weightKg) && typeof e.date === 'string')
    .map((e) => ({ date: e.date, d: toDayNumber(e.date), w: e.weightKg }))
    .filter((e) => Number.isFinite(e.d))
    .sort((a, b) => a.d - b.d);

  return pts.map((p, i) => {
    let sum = 0, n = 0;
    for (let j = i; j >= 0 && p.d - pts[j].d < windowDays; j--) { sum += pts[j].w; n++; }
    return { date: p.date, weightKg: p.w, trendKg: round(sum / n, 2) };
  });
}

/** Least-squares slope of y over x. */
function slope(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  return den === 0 ? 0 : num / den;
}

export const ADAPTIVE_MIN = { spanDays: 14, intakeDays: 10, weighIns: 6 };

/**
 * Estimates real-world TDEE from logged intake and the weight trend:
 *   TDEE ≈ average intake − (trend slope kg/day × 7700)
 *
 * The slope is fitted to the 7-day moving-average trend, not raw scale weight,
 * so water/glycogen swings (common on carb-cycle high days) don't dominate.
 * Days with no intake logged are excluded from the average rather than counted
 * as zero — counting them as zero is the classic bug that makes TDEE look tiny.
 *
 * @param {{ date: string, intakeKcal?: number|null, weightKg?: number|null }[]} entries
 * @param {object} [opts]
 * @param {number} [opts.lookbackDays=28]  only use the most recent N days
 * @param {number} [opts.formulaTdee]      if given, a suggestion is made when the gap is meaningful
 * @returns {{ status: 'insufficient', reason, have, need } |
 *           { status: 'ok', tdee, avgIntake, trendChangeKgPerWeek, spanDays, intakeDays, weighIns,
 *             confidence: 'low'|'medium'|'high', differsFromFormula: number|null, suggest: boolean }}
 */
export function estimateAdaptiveTDEE(entries, { lookbackDays = 28, formulaTdee } = {}) {
  const valid = (entries ?? []).filter((e) => e && typeof e.date === 'string' && Number.isFinite(toDayNumber(e.date)));
  if (!valid.length) {
    return { status: 'insufficient', reason: 'spanDays', have: 0, need: ADAPTIVE_MIN.spanDays };
  }
  const lastDay = Math.max(...valid.map((e) => toDayNumber(e.date)));
  const recent = valid.filter((e) => lastDay - toDayNumber(e.date) < lookbackDays);

  const intakes = recent.filter((e) => isNum(e.intakeKcal) && e.intakeKcal > 0);
  const trend = trendWeights(recent);
  const firstDay = Math.min(...recent.map((e) => toDayNumber(e.date)));
  const spanDays = lastDay - firstDay + 1;

  const checks = [
    ['spanDays', spanDays, ADAPTIVE_MIN.spanDays],
    ['intakeDays', intakes.length, ADAPTIVE_MIN.intakeDays],
    ['weighIns', trend.length, ADAPTIVE_MIN.weighIns],
  ];
  for (const [reason, have, need] of checks) {
    if (have < need) return { status: 'insufficient', reason, have, need };
  }

  const avgIntake = intakes.reduce((s, e) => s + e.intakeKcal, 0) / intakes.length;
  const kgPerDay = slope(trend.map((t) => toDayNumber(t.date)), trend.map((t) => t.trendKg));
  const tdee = avgIntake - kgPerDay * KCAL_PER_KG;

  const coverage = intakes.length / spanDays;
  const confidence = coverage >= 0.85 && spanDays >= 21 ? 'high' : coverage >= 0.6 ? 'medium' : 'low';

  const differs = isNum(formulaTdee) ? round(tdee - formulaTdee) : null;
  return {
    status: 'ok',
    tdee: round(tdee),
    avgIntake: round(avgIntake),
    trendChangeKgPerWeek: round(kgPerDay * 7, 2),
    spanDays,
    intakeDays: intakes.length,
    weighIns: trend.length,
    confidence,
    differsFromFormula: differs,
    suggest: differs != null && confidence !== 'low' && Math.abs(differs) >= 150,
  };
}
