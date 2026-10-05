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
 *   demo_final / demo-pass-123  — carb cycle, all 56 days logged (today is day 56)
 *   demo_admin / demo-pass-123  — super admin (sees the Admin page)
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

// ── Full 56-day carb cycle, finishing today ─────────────────────────────
// Realistic, deterministic data: meals sized to each day type, weight trending
// down with water swings after carb-heavy days, workouts on medium days, a few
// imperfect days, three planned cheat meals, weekly waist measurements.

function rng(seed) { // tiny deterministic PRNG (mulberry32)
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PROTEINS = ['escalope_poulet', 'escalope_dinde', 'poisson_blanc', 'tuna_canned', 'viande_hachee_5', 'saumon'];
const STARCHES = ['riz_basmati', 'pates_completes', 'couscous', 'boulgour_complet', 'riz_complet'];
const VEG = ['brocoli', 'courgette', 'haricot_vert', 'epinard', 'tomates', 'carotte'];
const FRUIT = ['pomme', 'orange', 'banane', 'strawberries', 'grenade', 'figue_fraiche'];

const roundTo = (v, step) => Math.max(step, Math.round(v / step) * step);

function mealsFor(type, n, r) {
  const pick = (arr, k = 0) => arr[(n + k) % arr.length];
  const f = 0.88 + r() * 0.2; // how closely the plan was followed today
  const g = (amount) => roundTo(amount * f, 10);
  if (type === 'low') {
    return {
      meal1: [{ food_id: 'eggs', amount: 3 }, { food_id: 'avocat', amount: g(90) }, { food_id: 'tomates', amount: 120 }],
      meal2: [{ food_id: pick(PROTEINS), amount: g(200) }, { food_id: 'laitue', amount: 100 }, { food_id: pick(VEG), amount: 150 }, { food_id: 'huile_olive', amount: 15 }, { food_id: 'lentilles', amount: g(110) }],
      meal3: [{ food_id: 'yaourt', amount: 150 }, { food_id: pick(['almonds', 'noix', 'pistaches']), amount: g(30) }],
      meal4: [{ food_id: pick(PROTEINS, 2), amount: g(190) }, { food_id: pick(VEG, 3), amount: 200 }, { food_id: 'huile_olive', amount: 10 }, { food_id: 'patate_douce', amount: g(100) }],
    };
  }
  const carbs = type === 'high' ? 1.25 : 1;
  return {
    meal1: [{ food_id: 'flocons_avoine', amount: g(380 * carbs) }, { food_id: 'banane', amount: 130 }, { food_id: 'lait_demi_ecreme', amount: 250 }, { food_id: 'whey_protein', amount: 30 }],
    meal2: [{ food_id: pick(PROTEINS), amount: g(200) }, { food_id: pick(STARCHES), amount: g(300 * carbs) }, { food_id: pick(VEG), amount: 150 }],
    meal3: [{ food_id: 'pain_complet', amount: g(80) }, { food_id: 'fromage_0', amount: 100 }, { food_id: pick(FRUIT), amount: 150 }],
    meal4: [{ food_id: pick(PROTEINS, 3), amount: g(210) }, { food_id: pick(STARCHES, 2), amount: g(280 * carbs) }, { food_id: pick(VEG, 1), amount: 150 }, { food_id: 'huile_olive', amount: 10 }],
  };
}

async function makeFullProgramme(username) {
  const existing = await db.select().from(users).where(eq(users.username, username)).get();
  if (existing) { console.log(`${username} exists — skipping`); return; }

  const profile = { sex: 'male', age: 31, height_cm: 180, weight_kg: 86, activity_level: 'moderate' };
  const now = new Date().toISOString();
  const { lastInsertRowid } = await db.insert(users).values({
    username, password_hash: hashPassword(PASSWORD), created_at: now,
    sex: profile.sex, age: profile.age, height_cm: profile.height_cm, activity_level: profile.activity_level,
  }).run();
  const id = Number(lastInsertRowid);
  const { warnings, ...targets } = calcTargets({ programme: 'carb_cycle', ...profile });
  const start = addDays(today, -55); // today is day 56 of 56
  await db.insert(appConfig).values({
    user_id: id, start_date: start, settings_json: '{}', programme: 'carb_cycle',
    current_weight_kg: profile.weight_kg, goal_weight_kg: 80, ...targets,
  }).run();

  const r = rng(56);
  const { getDayType } = await import('../lib/schedule.js');
  const CHEAT_DAYS = new Set([20, 34, 48]);
  const LIGHT_DAYS = new Set([9, 23, 30, 41]); // busy days: a meal skipped, less water
  const MOODS = ['great', 'good', 'good', 'ok', 'tired'];
  let prevType = 'med';

  for (let n = 0; n <= 55; n++) {
    const type = getDayType(n);
    const meals = mealsFor(type, n, r);
    if (LIGHT_DAYS.has(n)) delete meals.meal3;

    // ~0.75 kg/week loss, faster in phase 3, plus water: heavier the morning after a carb day.
    const lost = n < 14 ? n * 0.11 : n < 28 ? 1.54 + (n - 14) * 0.1 : n < 42 ? 2.94 + (n - 28) * 0.13 : 4.76 + (n - 42) * 0.07;
    const water = prevType === 'low' ? -0.25 : prevType === 'high' ? 0.55 : 0.2;
    const weight = +(86 - lost + water + (r() - 0.5) * 0.6).toFixed(1);
    const weighed = r() > 0.12 || n === 0 || n === 55;

    const waterGoal = { low: 2.5, med: 3, high: 3.5 }[type];
    const workout = type === 'med' && r() > 0.12;

    await upsertDay(id, addDays(start, n), {
      meals,
      water_liters: LIGHT_DAYS.has(n) ? 1.5 : roundTo(waterGoal + (r() - 0.3) * 0.8, 0.5),
      weight_kg: weighed ? weight : null,
      workout_done: workout,
      mood: MOODS[Math.floor(r() * MOODS.length)],
      energy_level: 2 + Math.floor(r() * 4),
      cheat_meal: CHEAT_DAYS.has(n),
      cheat_kcal: CHEAT_DAYS.has(n) ? 650 : 0,
      waist_cm: n % 7 === 0 || n === 55 ? +(94 - lost * 1.05 + (r() - 0.5) * 0.4).toFixed(1) : null,
      notes: n === 0 ? 'Day one. Measured everything, feeling motivated.'
        : n === 27 ? 'Halfway. Clothes fitting better.'
        : n === 55 ? 'Final day — programme complete.' : null,
    });
    prevType = type;
  }
  console.log(`seeded ${username} (56/56 days, start ${start})`);
}

const stats = { sex: 'male', age: 32, height_cm: 178, weight_kg: 84, activity_level: 'moderate' };
await makeUser('demo_carb', { programme: 'carb_cycle', startOffset: 20, stats, days: 20, startWeight: 84, kgPerDay: -0.07 });
await makeUser('demo_loss', { programme: 'weight_loss', startOffset: 30, stats, days: 28, startWeight: 84, kgPerDay: -0.06 });
await makeFullProgramme('demo_final');

// Local super admin for trying the Admin page.
if (!(await db.select().from(users).where(eq(users.username, 'demo_admin')).get())) {
  const now = new Date().toISOString();
  const { lastInsertRowid } = await db.insert(users).values({ username: 'demo_admin', password_hash: hashPassword(PASSWORD), created_at: now, role: 'superadmin' }).run();
  await db.insert(appConfig).values({ user_id: Number(lastInsertRowid), start_date: today, settings_json: '{}' }).run();
  console.log('seeded demo_admin (superadmin)');
}
process.exit(0);
