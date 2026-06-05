/**
 * Creates / migrates tables in Turso. Run with: node server/db/migrate.js
 */
import 'dotenv/config';
import { client } from './index.js';

async function run() {
  // Foreign key enforcement
  await client.execute(`PRAGMA foreign_keys = ON`);

  // Base tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS app_config (
      id INTEGER PRIMARY KEY,
      start_date TEXT NOT NULL
    )
  `);

  await client.execute(`
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
    )
  `);

  // Idempotent column additions
  const cols = await client.execute(`PRAGMA table_info(day_logs)`);
  const colNames = new Set(cols.rows.map(r => r.name));

  const addColumn = async (name, type) => {
    if (!colNames.has(name)) {
      await client.execute(`ALTER TABLE day_logs ADD COLUMN ${name} ${type}`);
      console.log(`Added ${name} column.`);
    }
  };

  await addColumn('meals_json', `TEXT NOT NULL DEFAULT '{}'`);
  await addColumn('workout_json', `TEXT NOT NULL DEFAULT '[]'`);
  await addColumn('waist_cm', 'REAL');
  await addColumn('chest_cm', 'REAL');
  await addColumn('arm_cm', 'REAL');
  await addColumn('thigh_cm', 'REAL');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS meal_presets (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      items_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  const cfgCols = await client.execute(`PRAGMA table_info(app_config)`);
  const cfgColNames = new Set(cfgCols.rows.map(r => r.name));
  if (!cfgColNames.has('settings_json')) {
    await client.execute(`ALTER TABLE app_config ADD COLUMN settings_json TEXT NOT NULL DEFAULT '{}'`);
    console.log('Added settings_json column to app_config.');
  }

  await client.execute(`
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
    )
  `);

  console.log('Migration complete.');
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
