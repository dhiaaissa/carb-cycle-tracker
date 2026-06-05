/**
 * Seeds app_config with today's date as start_date.
 * Idempotent: only inserts if no row exists; never overwrites an existing start_date.
 * Run with: node server/db/seed.js
 */
import 'dotenv/config';
import { db } from './index.js';
import { appConfig } from './schema.js';
import { eq } from 'drizzle-orm';

const today = new Date().toISOString().split('T')[0];
const desired = process.env.SEED_START_DATE || today;

const existing = db.select().from(appConfig).where(eq(appConfig.id, 1)).get();

if (existing) {
  if (process.env.SEED_START_DATE && existing.start_date !== desired) {
    db.update(appConfig).set({ start_date: desired }).where(eq(appConfig.id, 1)).run();
    console.log('Updated start_date to', desired, '(from SEED_START_DATE)');
  } else {
    console.log('start_date already seeded:', existing.start_date);
  }
} else {
  db.insert(appConfig).values({ id: 1, start_date: desired }).run();
  console.log('Seeded start_date as', desired);
}
