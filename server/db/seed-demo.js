/**
 * Dev-only demo data: two users with ~3 weeks of realistic logs.
 * Refuses to run unless TURSO_DATABASE_URL points at a local file: database.
 *
 *   TURSO_DATABASE_URL=file:./demo.db node server/db/migrate.js
 *   TURSO_DATABASE_URL=file:./demo.db node server/db/seed-demo.js
 *
 * Demo logins (local only):
 *   demo_carb / demo-pass-123   — carb cycle, started 20 days ago
 *   demo_loss / demo-pass-123   — weight loss, started 30 days ago
 */
import 'dotenv/config';

const url = process.env.TURSO_DATABASE_URL || '';
if (!url.startsWith('file:')) {
  console.error('seed-demo only runs against a local file: database. Refusing.');
  process.exit(1);
}

const { db } = await import('./index.js');
const { users, appConfig } = await import('./schema.js');
const { eq } = await import('drizzle-orm');
const { hashPassword } = await import('../lib/auth.js');
const { calcTargets } = await import('../lib/nutrition.js');
const { upsertDay } = await import('../lib/dayLogs.js');
const { addDays, localIsoDate } = await import('../../shared/dates.js');

const PASSWORD = 'demo-pass-123';
const today = localIsoDate();

const MEALS = [
  { meal1: [{ food_id: 'flocons_avoine', amount: 250 }, { food_id: 'banane', amount: 120 }],
    meal2: [{ food_id: 'escalope_poulet', amount: 150 }, { food_id: 'riz_basmati', amount: 150 }],
    meal3: [{ food_id: 'yaourt', amount: 125 }],
    meal4: [{ food_id: 'saumon', amount: 150 }, { food_id: 'huile_olive', amount: 10 }] },
  { meal1: [{ food_id: 'eggs', amount: 3 }, { food_id: 'pain_complet', amount: 60 }],
    meal2: [{ food_id: 'escalope_dinde', amount: 175 }, { food_id: 'pates_completes', amount: 150 }],
    meal3: [{ food_id: 'pomme', amount: 150 }],
    meal4: [{ food_id: 'poisson_blanc', amount: 200 }, { food_id: 'riz_complet', amount: 100 }] },
];

async function makeUser(username, { programme, startOffset, stats, days, startWeight, kgPerDay }) {
  const existing = await db.select().from(users).where(eq(users.username, username)).get();
  if (existing) { console.log(`${username} exists — skipping`); return; }

  const now = new Date().toISOString();
  const { lastInsertRowid } = await db.insert(users).values({
    username, password_hash: hashPassword(PASSWORD), created_at: now,
    sex: stats.sex, age: stats.age, height_cm: stats.height_cm, activity_level: stats.activity_level,
  }).run();
  const id = Number(lastInsertRowid);

  const { warnings, ...targets } = calcTargets({ programme, ...stats });
  await db.insert(appConfig).values({
    user_id: id, start_date: addDays(today, -startOffset), settings_json: '{}',
    programme, current_weight_kg: stats.weight_kg, ...targets,
  }).run();

  for (let i = days; i >= 1; i--) {
    if (i % 6 === 0) continue; // a few missed days, like real life
    const n = days - i;
    await upsertDay(id, addDays(today, -i), {
      meals: MEALS[n % 2],
      water_liters: 2 + (n % 3) * 0.5,
      weight_kg: n % 2 === 0 ? +(startWeight + kgPerDay * n + (n % 3 - 1) * 0.3).toFixed(1) : undefined,
    });
  }
  // Today: breakfast only
  await upsertDay(id, today, { meals: { meal1: MEALS[0].meal1 }, water_liters: 0.5 });
  console.log(`seeded ${username}`);
}

const stats = { sex: 'male', age: 32, height_cm: 178, weight_kg: 84, activity_level: 'moderate' };
await makeUser('demo_carb', { programme: 'carb_cycle', startOffset: 20, stats, days: 20, startWeight: 84, kgPerDay: -0.07 });
await makeUser('demo_loss', { programme: 'weight_loss', startOffset: 30, stats, days: 28, startWeight: 84, kgPerDay: -0.06 });
process.exit(0);
