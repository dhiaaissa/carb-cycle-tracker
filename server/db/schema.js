import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const appConfig = sqliteTable('app_config', {
  id: integer('id').primaryKey(),
  start_date: text('start_date').notNull(), // ISO date string YYYY-MM-DD
  settings_json: text('settings_json').notNull().default('{}'), // JSON: custom targets etc.
});

export const dayLogs = sqliteTable('day_logs', {
  id: integer('id').primaryKey(),
  day_index: integer('day_index').notNull().unique(), // 0–55
  day_type: text('day_type').notNull(),               // 'low' | 'med' | 'high'
  phase: integer('phase').notNull(),                   // 1–4
  meal1_done: integer('meal1_done', { mode: 'boolean' }).notNull().default(false),
  meal2_done: integer('meal2_done', { mode: 'boolean' }).notNull().default(false),
  meal3_done: integer('meal3_done', { mode: 'boolean' }).notNull().default(false),
  meal4_done: integer('meal4_done', { mode: 'boolean' }).notNull().default(false),
  water_liters: real('water_liters').notNull().default(0),
  workout_done: integer('workout_done', { mode: 'boolean' }).notNull().default(false),
  mood: text('mood'),              // 'great' | 'good' | 'ok' | 'tired' | 'bad'
  energy_level: integer('energy_level'), // 1–10
  weight_kg: real('weight_kg'),
  waist_cm: real('waist_cm'),
  chest_cm: real('chest_cm'),
  arm_cm: real('arm_cm'),
  thigh_cm: real('thigh_cm'),
  cheat_meal: integer('cheat_meal', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
  calories_consumed: real('calories_consumed').notNull().default(0),
  calories_target: real('calories_target').notNull().default(0),
  calories_remaining: real('calories_remaining').notNull().default(0),
  protein_g: real('protein_g').notNull().default(0),
  carbs_g: real('carbs_g').notNull().default(0),
  fat_g: real('fat_g').notNull().default(0),
  score: integer('score').notNull().default(0),
  meals_json: text('meals_json').notNull().default('{}'), // JSON: { meal1: [{food_id, amount}], ... }
  workout_json: text('workout_json').notNull().default('[]'), // JSON: [{exercise, sets, reps, weight_kg}, ...]
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const customFoods = sqliteTable('custom_foods', {
  id: integer('id').primaryKey(),
  food_id: text('food_id').notNull().unique(),     // slug e.g. 'custom_olive_oil'
  name: text('name').notNull(),
  emoji: text('emoji').notNull().default('🍽️'),
  category: text('category').notNull().default('custom'),
  unit: text('unit').notNull().default('g'),        // 'g' | 'piece'
  kcal_per_100g: real('kcal_per_100g'),             // for unit='g'
  protein_per_100g: real('protein_per_100g'),
  carbs_per_100g: real('carbs_per_100g'),
  fat_per_100g: real('fat_per_100g'),
  kcal_per_unit: real('kcal_per_unit'),             // for unit='piece'
  protein_per_unit: real('protein_per_unit'),
  carbs_per_unit: real('carbs_per_unit'),
  fat_per_unit: real('fat_per_unit'),
  default_amount: real('default_amount').notNull().default(100),
  step: real('step').notNull().default(25),
  created_at: text('created_at').notNull(),
});

export const mealPresets = sqliteTable('meal_presets', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  items_json: text('items_json').notNull(), // JSON: [{food_id, amount}, ...]
  created_at: text('created_at').notNull(),
});
