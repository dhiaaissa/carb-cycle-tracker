/**
 * One-shot script: copy data from local data.db to Turso.
 * Run with: node server/db/migrate-local-to-turso.js
 *
 * Reads from ./data.db (better-sqlite3) and inserts into Turso (libsql).
 * Skips rows that already exist (idempotent by primary key).
 */
import 'dotenv/config';
import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localPath = resolve(__dirname, '../../data.db');

if (!process.env.TURSO_DATABASE_URL) {
  console.error('TURSO_DATABASE_URL not set in .env');
  process.exit(1);
}

const local = new Database(localPath, { readonly: true });
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function copyTable(tableName, columns) {
  const rows = local.prepare(`SELECT * FROM ${tableName}`).all();
  console.log(`[${tableName}] ${rows.length} rows in local DB`);
  if (rows.length === 0) return;

  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    const cols = columns.filter(c => row[c] !== undefined);
    const placeholders = cols.map(() => '?').join(', ');
    const values = cols.map(c => row[c]);
    const sql = `INSERT OR IGNORE INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`;
    try {
      const result = await turso.execute({ sql, args: values });
      if (result.rowsAffected > 0) inserted++;
      else skipped++;
    } catch (err) {
      console.error(`[${tableName}] row id=${row.id} failed:`, err.message);
    }
  }
  console.log(`[${tableName}] inserted=${inserted}, skipped=${skipped}`);
}

const TABLES = {
  app_config: ['id', 'start_date', 'settings_json'],
  day_logs: [
    'id', 'day_index', 'day_type', 'phase',
    'meal1_done', 'meal2_done', 'meal3_done', 'meal4_done',
    'water_liters', 'workout_done', 'mood', 'energy_level', 'weight_kg',
    'waist_cm', 'chest_cm', 'arm_cm', 'thigh_cm',
    'cheat_meal', 'notes',
    'calories_consumed', 'calories_target', 'calories_remaining',
    'protein_g', 'carbs_g', 'fat_g', 'score',
    'meals_json', 'workout_json', 'created_at', 'updated_at',
  ],
  custom_foods: [
    'id', 'food_id', 'name', 'emoji', 'category', 'unit',
    'kcal_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fat_per_100g',
    'kcal_per_unit', 'protein_per_unit', 'carbs_per_unit', 'fat_per_unit',
    'default_amount', 'step', 'created_at',
  ],
  meal_presets: ['id', 'name', 'items_json', 'created_at'],
};

async function main() {
  for (const [table, cols] of Object.entries(TABLES)) {
    await copyTable(table, cols);
  }
  console.log('\nMigration complete.');
  local.close();
}

main().catch(err => { console.error(err); process.exit(1); });
