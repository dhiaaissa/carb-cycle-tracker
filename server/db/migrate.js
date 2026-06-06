/**
 * Creates / migrates tables in Turso. Run with: node server/db/migrate.js
 * Idempotent — safe to run on every deploy.
 */
import 'dotenv/config';
import { client } from './index.js';

async function run() {
  await client.execute(`PRAGMA foreign_keys = ON`);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS app_config (
      id INTEGER PRIMARY KEY,
      start_date TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS day_logs (
      id INTEGER PRIMARY KEY,
      day_index INTEGER NOT NULL,
      day_type TEXT NOT NULL,
      phase INTEGER NOT NULL,
      meal1_done INTEGER NOT NULL DEFAULT 0,
      meal2_done INTEGER NOT NULL DEFAULT 0,
      meal3_done INTEGER NOT NULL DEFAULT 0,
      meal4_done INTEGER NOT NULL DEFAULT 0,
      water_liters REAL NOT NULL DEFAULT 0,
      workout_done INTEGER NOT NULL DEFAULT 0,
      mood TEXT,
      energy_level INTEGER,
      weight_kg REAL,
      cheat_meal INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      calories_consumed REAL NOT NULL DEFAULT 0,
      calories_target REAL NOT NULL DEFAULT 0,
      calories_remaining REAL NOT NULL DEFAULT 0,
      protein_g REAL NOT NULL DEFAULT 0,
      carbs_g REAL NOT NULL DEFAULT 0,
      fat_g REAL NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS meal_presets (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      items_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS custom_foods (
      id INTEGER PRIMARY KEY,
      food_id TEXT NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '🍽️',
      category TEXT NOT NULL DEFAULT 'custom',
      unit TEXT NOT NULL DEFAULT 'g',
      kcal_per_100g REAL,
      protein_per_100g REAL,
      carbs_per_100g REAL,
      fat_per_100g REAL,
      kcal_per_unit REAL,
      protein_per_unit REAL,
      carbs_per_unit REAL,
      fat_per_unit REAL,
      default_amount REAL NOT NULL DEFAULT 100,
      step REAL NOT NULL DEFAULT 25,
      created_at TEXT NOT NULL
    )
  `);

  // Idempotent column additions
  const addColumn = async (table, name, type) => {
    const cols = await client.execute(`PRAGMA table_info(${table})`);
    const has = cols.rows.some(r => r.name === name);
    if (!has) {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
      console.log(`[${table}] added ${name}`);
    }
  };

  // day_logs ALTERs from earlier rounds
  await addColumn('day_logs', 'meals_json', `TEXT NOT NULL DEFAULT '{}'`);
  await addColumn('day_logs', 'workout_json', `TEXT NOT NULL DEFAULT '[]'`);
  await addColumn('day_logs', 'waist_cm', 'REAL');
  await addColumn('day_logs', 'chest_cm', 'REAL');
  await addColumn('day_logs', 'arm_cm', 'REAL');
  await addColumn('day_logs', 'thigh_cm', 'REAL');

  // app_config settings_json
  await addColumn('app_config', 'settings_json', `TEXT NOT NULL DEFAULT '{}'`);

  // user_id columns — added with default 0 sentinel so existing rows backfill later
  await addColumn('app_config', 'user_id', 'INTEGER NOT NULL DEFAULT 0');
  await addColumn('day_logs', 'user_id', 'INTEGER NOT NULL DEFAULT 0');
  await addColumn('custom_foods', 'user_id', 'INTEGER NOT NULL DEFAULT 0');
  await addColumn('meal_presets', 'user_id', 'INTEGER NOT NULL DEFAULT 0');

  // Programme + nutrition profile columns
  await addColumn('users', 'sex', 'TEXT');
  await addColumn('users', 'age', 'INTEGER');
  await addColumn('users', 'height_cm', 'REAL');
  await addColumn('users', 'activity_level', 'TEXT');

  await addColumn('app_config', 'programme', `TEXT NOT NULL DEFAULT 'carb_cycle'`);
  await addColumn('app_config', 'goal_weight_kg', 'REAL');
  await addColumn('app_config', 'current_weight_kg', 'REAL');
  await addColumn('app_config', 'bmr', 'REAL');
  await addColumn('app_config', 'tdee', 'REAL');
  await addColumn('app_config', 'calorie_target', 'REAL');
  await addColumn('app_config', 'protein_g_target', 'REAL');
  await addColumn('app_config', 'carbs_g_target', 'REAL');
  await addColumn('app_config', 'fat_g_target', 'REAL');

  // Detect and drop legacy single-column UNIQUE constraints baked into table DDL.
  // Replaces them with composite UNIQUE indexes per-user.
  const dropLegacyUnique = async (table, legacyAutoindex, newDef, copyCols) => {
    const idx = await client.execute(`PRAGMA index_list(${table})`);
    const hasLegacy = idx.rows.some(r => r.name === legacyAutoindex);
    if (!hasLegacy) return;
    console.log(`[${table}] dropping legacy UNIQUE via table rebuild`);
    await client.execute(`ALTER TABLE ${table} RENAME TO ${table}_old`);
    await client.execute(newDef);
    await client.execute(`INSERT INTO ${table} (${copyCols}) SELECT ${copyCols} FROM ${table}_old`);
    await client.execute(`DROP TABLE ${table}_old`);
  };

  await dropLegacyUnique(
    'day_logs',
    'sqlite_autoindex_day_logs_1',
    `CREATE TABLE day_logs (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL DEFAULT 0,
      day_index INTEGER NOT NULL,
      day_type TEXT NOT NULL,
      phase INTEGER NOT NULL,
      meal1_done INTEGER NOT NULL DEFAULT 0,
      meal2_done INTEGER NOT NULL DEFAULT 0,
      meal3_done INTEGER NOT NULL DEFAULT 0,
      meal4_done INTEGER NOT NULL DEFAULT 0,
      water_liters REAL NOT NULL DEFAULT 0,
      workout_done INTEGER NOT NULL DEFAULT 0,
      mood TEXT,
      energy_level INTEGER,
      weight_kg REAL,
      cheat_meal INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      calories_consumed REAL NOT NULL DEFAULT 0,
      calories_target REAL NOT NULL DEFAULT 0,
      calories_remaining REAL NOT NULL DEFAULT 0,
      protein_g REAL NOT NULL DEFAULT 0,
      carbs_g REAL NOT NULL DEFAULT 0,
      fat_g REAL NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      meals_json TEXT NOT NULL DEFAULT '{}',
      workout_json TEXT NOT NULL DEFAULT '[]',
      waist_cm REAL,
      chest_cm REAL,
      arm_cm REAL,
      thigh_cm REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `id, user_id, day_index, day_type, phase, meal1_done, meal2_done, meal3_done, meal4_done, water_liters, workout_done, mood, energy_level, weight_kg, cheat_meal, notes, calories_consumed, calories_target, calories_remaining, protein_g, carbs_g, fat_g, score, meals_json, workout_json, waist_cm, chest_cm, arm_cm, thigh_cm, created_at, updated_at`
  );

  await dropLegacyUnique(
    'custom_foods',
    'sqlite_autoindex_custom_foods_1',
    `CREATE TABLE custom_foods (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL DEFAULT 0,
      food_id TEXT NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '🍽️',
      category TEXT NOT NULL DEFAULT 'custom',
      unit TEXT NOT NULL DEFAULT 'g',
      kcal_per_100g REAL,
      protein_per_100g REAL,
      carbs_per_100g REAL,
      fat_per_100g REAL,
      kcal_per_unit REAL,
      protein_per_unit REAL,
      carbs_per_unit REAL,
      fat_per_unit REAL,
      default_amount REAL NOT NULL DEFAULT 100,
      step REAL NOT NULL DEFAULT 25,
      created_at TEXT NOT NULL
    )`,
    `id, user_id, food_id, name, emoji, category, unit, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, kcal_per_unit, protein_per_unit, carbs_per_unit, fat_per_unit, default_amount, step, created_at`
  );

  // Composite uniqueness on (user_id, day_index) — created if not exists
  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS day_logs_user_day_unique
    ON day_logs(user_id, day_index)
  `);

  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS custom_foods_user_food_unique
    ON custom_foods(user_id, food_id)
  `);

  console.log('Migration complete.');
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
