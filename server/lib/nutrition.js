/**
 * Server adapter over the shared nutrition engine (shared/nutrition.js).
 * Keeps the snake_case API the routes already use.
 */
import { ACTIVITY_LEVELS, validateProfile } from '../../shared/nutrition.js';
import { planForProgramme, toProfile } from '../../shared/dayTargets.js';

export const ACTIVITY_FACTORS = Object.fromEntries(
  Object.entries(ACTIVITY_LEVELS).map(([k, v]) => [k, v.factor]),
);

export const PROGRAMMES = {
  carb_cycle: {
    name: 'Carb Cycle',
    description: '56-day structured carb cycling programme',
    emoji: '🔄',
    usesCalculator: false,
  },
  weight_loss: {
    name: 'Weight Loss',
    description: 'Moderate deficit to lose ~0.5 kg/week',
    emoji: '📉',
    usesCalculator: true,
  },
  muscle_gain: {
    name: 'Muscle Gain',
    description: 'Lean bulk to gain ~0.25 kg/week',
    emoji: '💪',
    usesCalculator: true,
  },
  recomp: {
    name: 'Body Recomposition',
    description: 'Slight deficit to lose fat + gain muscle',
    emoji: '⚖️',
    usesCalculator: true,
  },
};

const ERROR_MESSAGES = {
  sex: 'sex must be male or female',
  age: 'age must be between 13 and 100',
  weight: 'weight_kg must be between 30 and 300',
  height: 'height_cm must be between 100 and 250',
  activity: 'activity_level invalid',
  bodyFat: 'body_fat_pct must be between 3 and 60',
};

export function validateStats(stats) {
  return validateProfile(toProfile(stats)).map((code) => ERROR_MESSAGES[code] ?? code);
}

/**
 * @returns {{ bmr, tdee, calorie_target, protein_g_target, carbs_g_target, fat_g_target, warnings } | null}
 * For carb_cycle, the single-target fields are null (per-day targets are resolved at read time).
 */
export function calcTargets({ programme, ...stats }) {
  if (!PROGRAMMES[programme]) return null;
  const plan = planForProgramme(programme, toProfile(stats));
  if (!plan.ok) return null;

  const single = programme !== 'carb_cycle';
  return {
    bmr: plan.bmr,
    tdee: plan.tdee,
    calorie_target: single ? plan.calories : null,
    protein_g_target: single ? plan.protein_g : null,
    carbs_g_target: single ? plan.carbs_g : null,
    fat_g_target: single ? plan.fat_g : null,
    warnings: plan.warnings,
  };
}
