import { db } from '../db/index.js';
import { appConfig, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { resolveDayTargets, goalSettingsFor, toProfile } from '../../shared/dayTargets.js';

/**
 * Resolves a config row + user row into targets for every day type.
 * Pass { withOverrides: false } to get the suggested (calculated) values only.
 */
export function dayTargetsFor(cfg, user, { withOverrides = true } = {}) {
  let settings = {};
  try { settings = JSON.parse(cfg?.settings_json || '{}'); } catch {}
  const programme = cfg?.programme || 'carb_cycle';
  const profile = user?.sex ? toProfile({ ...user, current_weight_kg: cfg?.current_weight_kg }) : null;
  return resolveDayTargets({
    programme,
    profile,
    tdee: cfg?.tdee,
    goalSettings: goalSettingsFor(programme, cfg),
    overrides: withOverrides ? settings.calorie_targets : undefined,
    stored: {
      calories: cfg?.calorie_target,
      protein_g: cfg?.protein_g_target,
      carbs_g: cfg?.carbs_g_target,
      fat_g: cfg?.fat_g_target,
    },
  });
}

export async function loadUserContext(userId) {
  const [cfg, user] = await Promise.all([
    db.select().from(appConfig).where(eq(appConfig.user_id, userId)).get(),
    db.select().from(users).where(eq(users.id, userId)).get(),
  ]);
  return { cfg, user, dayTargets: dayTargetsFor(cfg, user) };
}

export async function loadDayTargets(userId) {
  return (await loadUserContext(userId)).dayTargets;
}
