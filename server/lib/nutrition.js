/**
 * Nutrition calculator: BMR (Mifflin-St Jeor), TDEE, calorie + macro targets per goal.
 * Pure functions — no I/O. Safe to import on both server and client if needed.
 */

export const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extreme: 1.9,
};

export const ACTIVITY_LABELS = {
  sedentary: 'Sedentary (desk job, no exercise)',
  light: 'Lightly Active (1–3 days/wk)',
  moderate: 'Moderately Active (3–5 days/wk)',
  very: 'Very Active (6–7 days/wk)',
  extreme: 'Extremely Active (physical job + training)',
};

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
    calorieAdjustment: -500,
    macros: { protein: 0.32, fat: 0.28, carbs: 0.40 },
    proteinPerKg: 2.0,
    usesCalculator: true,
  },
  muscle_gain: {
    name: 'Muscle Gain',
    description: 'Lean bulk with moderate surplus',
    emoji: '💪',
    calorieAdjustment: 300,
    macros: { protein: 0.28, fat: 0.22, carbs: 0.50 },
    proteinPerKg: 1.8,
    usesCalculator: true,
  },
  recomp: {
    name: 'Body Recomposition',
    description: 'Slight deficit to lose fat + gain muscle',
    emoji: '⚖️',
    calorieAdjustment: -200,
    macros: { protein: 0.32, fat: 0.28, carbs: 0.40 },
    proteinPerKg: 2.0,
    usesCalculator: true,
  },
};

export function calcBMR({ sex, weight_kg, height_cm, age }) {
  if (!sex || !weight_kg || !height_cm || !age) return null;
  const base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age);
  return sex === 'male' ? base + 5 : base - 161;
}

export function calcTDEE(bmr, activity_level) {
  if (!bmr) return null;
  const factor = ACTIVITY_FACTORS[activity_level] ?? ACTIVITY_FACTORS.moderate;
  return bmr * factor;
}

export function calcTargets({ programme, sex, weight_kg, height_cm, age, activity_level }) {
  const prog = PROGRAMMES[programme];
  if (!prog || !prog.usesCalculator) return null;

  const bmr = calcBMR({ sex, weight_kg, height_cm, age });
  const tdee = calcTDEE(bmr, activity_level);
  if (!bmr || !tdee) return null;

  let calories = tdee + prog.calorieAdjustment;
  if (calories < bmr) calories = bmr;

  const proteinFromKg = prog.proteinPerKg * weight_kg;
  const proteinFromPct = (calories * prog.macros.protein) / 4;
  const protein_g = Math.max(proteinFromKg, proteinFromPct);
  const proteinCals = protein_g * 4;

  const remainingCals = calories - proteinCals;
  const fatRatio = prog.macros.fat / (prog.macros.fat + prog.macros.carbs);
  const fat_g = (remainingCals * fatRatio) / 9;
  const carbs_g = (remainingCals * (1 - fatRatio)) / 4;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorie_target: Math.round(calories),
    protein_g_target: Math.round(protein_g),
    carbs_g_target: Math.round(carbs_g),
    fat_g_target: Math.round(fat_g),
  };
}

export function validateStats({ sex, weight_kg, height_cm, age, activity_level }) {
  const errors = [];
  if (!['male', 'female'].includes(sex)) errors.push('sex must be male or female');
  if (!weight_kg || weight_kg < 30 || weight_kg > 300) errors.push('weight_kg must be between 30 and 300');
  if (!height_cm || height_cm < 100 || height_cm > 250) errors.push('height_cm must be between 100 and 250');
  if (!age || age < 13 || age > 100) errors.push('age must be between 13 and 100');
  if (!ACTIVITY_FACTORS[activity_level]) errors.push('activity_level invalid');
  return errors;
}
