import { db } from '../db/index.js';
import { appConfig } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function getOrCreateConfig(userId) {
  let cfg = await db.select().from(appConfig).where(eq(appConfig.user_id, userId)).get();
  if (!cfg) {
    const today = new Date().toISOString().split('T')[0];
    await db.insert(appConfig).values({
      user_id: userId,
      start_date: today,
      settings_json: '{}',
    }).run();
    cfg = await db.select().from(appConfig).where(eq(appConfig.user_id, userId)).get();
  }
  return cfg;
}
