/**
 * Creates / migrates tables. Run with: node server/db/migrate.js
 */
import 'dotenv/config';
import Database from 'better-sqlite3';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH
  ? resolve(process.env.DB_PATH)
  : resolve(__dirname, '../../data.db');

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS app_config (
    id INTEGER PRIMARY KEY,
    start_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS day_logs (
    id INTEGER PRIMARY KEY,
    day_index INTEGER NOT NULL UNIQUE,
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
  );
`);

// Add meals_json column if it doesn't exist yet (idempotent migration)
const cols = sqlite.prepare(`PRAGMA table_info(day_logs)`).all();
const hasMealsJson = cols.some(c => c.name === 'meals_json');
if (!hasMealsJson) {
  sqlite.exec(`ALTER TABLE day_logs ADD COLUMN meals_json TEXT NOT NULL DEFAULT '{}'`);
  console.log('Added meals_json column.');
}

// Add workout_json column if it doesn't exist yet
const hasWorkoutJson = cols.some(c => c.name === 'workout_json');
if (!hasWorkoutJson) {
  sqlite.exec(`ALTER TABLE day_logs ADD COLUMN workout_json TEXT NOT NULL DEFAULT '[]'`);
  console.log('Added workout_json column.');
}

// Add body measurement columns if they don't exist
['waist_cm', 'chest_cm', 'arm_cm', 'thigh_cm'].forEach(col => {
  if (!cols.some(c => c.name === col)) {
    sqlite.exec(`ALTER TABLE day_logs ADD COLUMN ${col} REAL`);
    console.log(`Added ${col} column.`);
  }
});

// Create meal_presets table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS meal_presets (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    items_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

// Add settings_json column to app_config if not exists
const configCols = sqlite.prepare(`PRAGMA table_info(app_config)`).all();
if (!configCols.some(c => c.name === 'settings_json')) {
  sqlite.exec(`ALTER TABLE app_config ADD COLUMN settings_json TEXT NOT NULL DEFAULT '{}'`);
  console.log('Added settings_json column to app_config.');
}

// Create custom_foods table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS custom_foods (
    id INTEGER PRIMARY KEY,
    food_id TEXT NOT NULL UNIQUE,
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
  );
`);

console.log('Migration complete. Database at:', dbPath);
sqlite.close();
