/**
 * Create or promote the super admin.
 *
 *   node server/create-admin.js <username>              promote an existing account
 *   node server/create-admin.js <username> <password>   create the account if it doesn't exist
 *
 * Uses the database in TURSO_DATABASE_URL (your .env), so run it where that points.
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { users, appConfig } from './db/schema.js';
import { hashPassword } from './lib/auth.js';
import { logEvent } from './lib/audit.js';

const [, , rawUsername, password] = process.argv;
const username = (rawUsername || '').toLowerCase();

if (!/^[a-z0-9_]{3,20}$/.test(username)) {
  console.error('Usage: node server/create-admin.js <username> [password]   (username: 3–20 letters, digits, underscores)');
  process.exit(1);
}

const existing = await db.select().from(users).where(eq(users.username, username)).get();
if (existing) {
  await db.update(users).set({ role: 'superadmin', status: 'active', suspended_reason: null }).where(eq(users.id, existing.id)).run();
  await logEvent(null, { action: 'admin.role_change', actor: { id: null, username: 'cli' }, target: { type: 'user', id: existing.id, label: username }, details: { from: existing.role, to: 'superadmin' } });
  console.log(`"${username}" is now a super admin.`);
  process.exit(0);
}

if (!password || password.length < 10) {
  console.error(`No account "${username}" yet. To create it, pass a password of at least 10 characters.`);
  process.exit(1);
}

const now = new Date().toISOString();
const { lastInsertRowid } = await db.insert(users).values({
  username, password_hash: hashPassword(password), created_at: now, role: 'superadmin',
}).run();
const id = Number(lastInsertRowid);
await db.insert(appConfig).values({ user_id: id, start_date: now.slice(0, 10), settings_json: '{}' }).run();
await logEvent(null, { action: 'auth.register', actor: { id: null, username: 'cli' }, target: { type: 'user', id, label: username }, details: { role: 'superadmin' } });
console.log(`Created super admin "${username}". Log in and change the password from your profile.`);
process.exit(0);
