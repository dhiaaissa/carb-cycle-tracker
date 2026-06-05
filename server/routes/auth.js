import { Router } from 'express';
import { db, client } from '../db/index.js';
import { users, appConfig } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword, signToken } from '../lib/auth.js';

const router = Router();

const USERNAME_RE = /^[a-z0-9_]{3,20}$/i;

router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    if (!USERNAME_RE.test(username)) return res.status(400).json({ error: 'Username must be 3–20 letters/digits/underscores' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const normalized = username.toLowerCase();
    const existing = await db.select().from(users).where(eq(users.username, normalized)).get();
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const now = new Date().toISOString();
    const result = await db.insert(users).values({
      username: normalized,
      password_hash: hashPassword(password),
      created_at: now,
    }).run();
    const newId = Number(result.lastInsertRowid);

    const owner = (process.env.OWNER_USERNAME || '').toLowerCase();
    if (owner && normalized === owner) {
      // Owner registration: claim all unassigned (user_id=0) rows
      await client.execute({
        sql: `UPDATE app_config SET user_id = ? WHERE user_id = 0`,
        args: [newId],
      });
      await client.execute({
        sql: `UPDATE day_logs SET user_id = ? WHERE user_id = 0`,
        args: [newId],
      });
      await client.execute({
        sql: `UPDATE custom_foods SET user_id = ? WHERE user_id = 0`,
        args: [newId],
      });
      await client.execute({
        sql: `UPDATE meal_presets SET user_id = ? WHERE user_id = 0`,
        args: [newId],
      });
      console.log(`[auth] Owner ${normalized} claimed orphaned rows.`);
    }

    // Ensure they have an app_config row (today as default start)
    const cfg = await db.select().from(appConfig).where(eq(appConfig.user_id, newId)).get();
    if (!cfg) {
      const today = new Date().toISOString().split('T')[0];
      await db.insert(appConfig).values({
        user_id: newId,
        start_date: today,
        settings_json: '{}',
      }).run();
    }

    const token = signToken({ id: newId, username: normalized });
    res.json({ token, user: { id: newId, username: normalized } });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const normalized = username.toLowerCase();
    const user = await db.select().from(users).where(eq(users.username, normalized)).get();
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = signToken({ id: user.id, username: user.username });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) { next(err); }
});

router.get('/me', async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });
    const { verifyToken } = await import('../lib/auth.js');
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });
    res.json({ user: { id: payload.id, username: payload.username } });
  } catch (err) { next(err); }
});

export default router;
