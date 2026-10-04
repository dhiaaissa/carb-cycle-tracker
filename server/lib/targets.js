import { db } from '../db/index.js';
import { appConfig, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { resolveDayTargets, toProfile } from '../../shared/dayTargets.js';

/**
 * Resolves a config row + user row into per-day-type targets.
 * Pass { withOverrides: false } to get the suggested (calculated) values only.
 */
export function dayTargetsFor(cfg, user, { withOverrides = true } = {}) {
  let settings = {};
  try { settings = JSON.parse(cfg?.settings_json || '{}'); } catch {}
  const profile = user?.sex ? toProfile({ ...user, current_weight_kg: cfg?.current_weight_kg }) : null;
  const overrides = withOverrides ? settings.calorie_targets : undefined;
  return resolveDayTargets({ profile, tdee: cfg?.tdee, overrides });
}

export async function loadDayTargets(userId) {
  const [cfg, user] = await Promise.all([
    db.select().from(appConfig).where(eq(appConfig.user_id, userId)).get(),
    db.select().from(users).where(eq(users.id, userId)).get(),
  ]);
  return dayTargetsFor(cfg, user);
}
