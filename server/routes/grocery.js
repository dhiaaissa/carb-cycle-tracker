import { Router } from 'express';
import { db } from '../db/index.js';
import { dayLogs, customFoods } from '../db/schema.js';
import { FOODS } from '../lib/foods.js';
import { getDayType, getPhase, generateSchedule } from '../lib/schedule.js';
import { eq, inArray } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/grocery?days=3&from=today
 * Generates a grocery list based on:
 *   1. Logged meals from recent days (meal patterns)
 *   2. Presets and frequently used foods
 *
 * Query params:
 *   - days: number of days to generate for (default: 7)
 *   - mode: 'patterns' (from past meals) or 'upcoming' (from already-planned meals)
 */
router.get('/', (req, res) => {
  const numDays = Math.min(parseInt(req.query.days) || 7, 14);
  const mode = req.query.mode || 'patterns';

  // Get all logged days
  const rows = db.select().from(dayLogs).all();
  const loggedDays = rows.map(row => {
    let meals_json = {};
    try { meals_json = JSON.parse(row.meals_json || '{}'); } catch {}
    return { ...row, meals_json };
  }).filter(d => Object.keys(d.meals_json).length > 0);

  if (loggedDays.length === 0) {
    return res.json({
      grocery_list: [],
      grouped: {},
      summary: { total_items: 0, days_covered: numDays, based_on_days: 0 },
    });
  }

  // Get custom foods from DB
  const customFoodRows = db.select().from(customFoods).all();
  const allFoods = { ...FOODS };
  customFoodRows.forEach(cf => {
    allFoods[cf.food_id] = cf;
  });

  // Aggregate food usage across all logged days
  const foodUsage = {}; // food_id -> { total_amount, count, avg_amount }

  loggedDays.forEach(day => {
    const meals = day.meals_json;
    ['meal1', 'meal2', 'meal3', 'meal4'].forEach(mealKey => {
      const items = meals[mealKey] || [];
      items.forEach(item => {
        if (!item.food_id || !item.amount) return;
        if (!foodUsage[item.food_id]) {
          foodUsage[item.food_id] = { total_amount: 0, count: 0 };
        }
        foodUsage[item.food_id].total_amount += item.amount;
        foodUsage[item.food_id].count += 1;
      });
    });
  });

  // Calculate average daily usage and project for requested days
  const daysLogged = loggedDays.length;
  const groceryItems = [];

  Object.entries(foodUsage).forEach(([foodId, usage]) => {
    const food = allFoods[foodId];
    if (!food) return;

    const avgPerDay = usage.total_amount / daysLogged;
    const projected = Math.ceil(avgPerDay * numDays);

    // Round to sensible amounts based on unit
    let amount;
    if (food.unit === 'g') {
      amount = Math.ceil(projected / 50) * 50; // Round to nearest 50g
    } else {
      amount = Math.ceil(projected); // Round up for countable items
    }

    groceryItems.push({
      food_id: foodId,
      name: food.name,
      emoji: food.emoji || '🍽️',
      category: food.category || 'other',
      unit: food.unit,
      amount,
      frequency: Math.round((usage.count / daysLogged) * 100), // % of days used
    });
  });

  // Sort by frequency (most used first)
  groceryItems.sort((a, b) => b.frequency - a.frequency);

  // Group by category
  const grouped = {};
  groceryItems.forEach(item => {
    const cat = item.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  res.json({
    grocery_list: groceryItems,
    grouped,
    summary: {
      total_items: groceryItems.length,
      days_covered: numDays,
      based_on_days: daysLogged,
    },
  });
});

/**
 * GET /api/grocery/weekly
 * Generates a grocery list for the upcoming week based on the schedule's day types
 * and the user's most common meals for each day type (low/med/high).
 */
router.get('/weekly', (req, res) => {
  const rows = db.select().from(dayLogs).all();
  const loggedDays = rows.map(row => {
    let meals_json = {};
    try { meals_json = JSON.parse(row.meals_json || '{}'); } catch {}
    return { ...row, meals_json };
  }).filter(d => Object.keys(d.meals_json).length > 0);

  // Get custom foods
  const customFoodRows = db.select().from(customFoods).all();
  const allFoods = { ...FOODS };
  customFoodRows.forEach(cf => { allFoods[cf.food_id] = cf; });

  // Group meals by day_type to find patterns
  const mealsByType = { low: [], med: [], high: [] };
  loggedDays.forEach(day => {
    if (day.day_type && mealsByType[day.day_type]) {
      mealsByType[day.day_type].push(day.meals_json);
    }
  });

  // For the next 7 days, figure out day types from schedule
  const startDayIndex = parseInt(req.query.from_day) || 0;
  const upcomingDays = [];
  for (let i = startDayIndex; i < Math.min(startDayIndex + 7, 56); i++) {
    upcomingDays.push({ day_index: i, day_type: getDayType(i) });
  }

  // Aggregate typical foods needed for this week's day types
  const weeklyNeeds = {};

  upcomingDays.forEach(({ day_type }) => {
    const typeMeals = mealsByType[day_type] || [];
    if (typeMeals.length === 0) return;

    // Average across all logged days of this type
    const typeUsage = {};
    typeMeals.forEach(mealsObj => {
      ['meal1', 'meal2', 'meal3', 'meal4'].forEach(mealKey => {
        (mealsObj[mealKey] || []).forEach(item => {
          if (!item.food_id || !item.amount) return;
          if (!typeUsage[item.food_id]) typeUsage[item.food_id] = { total: 0, count: 0 };
          typeUsage[item.food_id].total += item.amount;
          typeUsage[item.food_id].count += 1;
        });
      });
    });

    // Add average for one day of this type
    Object.entries(typeUsage).forEach(([foodId, usage]) => {
      const avgForOneDay = usage.total / typeMeals.length;
      if (!weeklyNeeds[foodId]) weeklyNeeds[foodId] = 0;
      weeklyNeeds[foodId] += avgForOneDay;
    });
  });

  // Build grocery list
  const groceryItems = [];
  Object.entries(weeklyNeeds).forEach(([foodId, totalAmount]) => {
    const food = allFoods[foodId];
    if (!food) return;

    let amount;
    if (food.unit === 'g') {
      amount = Math.ceil(totalAmount / 50) * 50;
    } else {
      amount = Math.ceil(totalAmount);
    }

    groceryItems.push({
      food_id: foodId,
      name: food.name,
      emoji: food.emoji || '🍽️',
      category: food.category || 'other',
      unit: food.unit,
      amount,
    });
  });

  // Group by category
  const grouped = {};
  groceryItems.forEach(item => {
    const cat = item.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  res.json({
    grocery_list: groceryItems,
    grouped,
    upcoming_days: upcomingDays,
    summary: {
      total_items: groceryItems.length,
      days_covered: upcomingDays.length,
    },
  });
});

export default router;
