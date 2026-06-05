import { Router } from 'express';
import { db } from '../db/index.js';
import { dayLogs } from '../db/schema.js';
import { CALORIE_TARGETS } from '../lib/calories.js';

const router = Router();

// GET /api/insights — analytics data
router.get('/', (req, res) => {
  const rows = db.select().from(dayLogs).all();

  if (rows.length === 0) {
    return res.json({
      calorie_adherence: [],
      macro_averages: { protein_g: 0, carbs_g: 0, fat_g: 0 },
      top_foods: [],
      best_day: null,
      worst_day: null,
      weekly_adherence: [],
      total_days_logged: 0,
    });
  }

  // Parse meals_json for food counting
  const foodCounts = {};
  rows.forEach(row => {
    let meals = {};
    try { meals = JSON.parse(row.meals_json || '{}'); } catch {}
    ['meal1', 'meal2', 'meal3', 'meal4'].forEach(mk => {
      (meals[mk] || []).forEach(item => {
        if (!foodCounts[item.food_id]) foodCounts[item.food_id] = 0;
        foodCounts[item.food_id]++;
      });
    });
  });

  const topFoods = Object.entries(foodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([food_id, count]) => ({ food_id, count }));

  // Calorie adherence per day
  const calorieAdherence = rows.map(r => {
    const target = r.calories_target || CALORIE_TARGETS[r.day_type] || 1400;
    const pct = target > 0 ? Math.round((r.calories_consumed / target) * 100) : 0;
    return { day_index: r.day_index, day_type: r.day_type, pct, consumed: r.calories_consumed, target };
  });

  // Weekly adherence
  const weeklyAdherence = [];
  for (let w = 1; w <= 8; w++) {
    const weekRows = rows.filter(r => Math.floor(r.day_index / 7) + 1 === w);
    if (weekRows.length === 0) continue;
    const avgPct = Math.round(weekRows.reduce((sum, r) => {
      const target = r.calories_target || CALORIE_TARGETS[r.day_type] || 1400;
      return sum + (target > 0 ? (r.calories_consumed / target) * 100 : 0);
    }, 0) / weekRows.length);
    const avgScore = +(weekRows.reduce((s, r) => s + r.score, 0) / weekRows.length).toFixed(1);
    weeklyAdherence.push({ week: w, days_logged: weekRows.length, avg_adherence_pct: avgPct, avg_score: avgScore });
  }

  // Macro averages
  const macroSum = rows.reduce((acc, r) => ({
    protein_g: acc.protein_g + (r.protein_g || 0),
    carbs_g: acc.carbs_g + (r.carbs_g || 0),
    fat_g: acc.fat_g + (r.fat_g || 0),
  }), { protein_g: 0, carbs_g: 0, fat_g: 0 });
  const macroAverages = {
    protein_g: Math.round(macroSum.protein_g / rows.length),
    carbs_g: Math.round(macroSum.carbs_g / rows.length),
    fat_g: Math.round(macroSum.fat_g / rows.length),
  };

  // Best/worst days
  const sorted = [...rows].sort((a, b) => b.score - a.score || b.calories_consumed - a.calories_consumed);
  const bestDay = sorted[0] ? { day_index: sorted[0].day_index, score: sorted[0].score, calories: sorted[0].calories_consumed } : null;
  const worstDay = sorted[sorted.length - 1] ? { day_index: sorted[sorted.length - 1].day_index, score: sorted[sorted.length - 1].score, calories: sorted[sorted.length - 1].calories_consumed } : null;

  res.json({
    calorie_adherence: calorieAdherence,
    macro_averages: macroAverages,
    top_foods: topFoods,
    best_day: bestDay,
    worst_day: worstDay,
    weekly_adherence: weeklyAdherence,
    total_days_logged: rows.length,
  });
});

export default router;
