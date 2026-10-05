import { Router } from 'express';
import { db, client } from '../db/index.js';
import { users, appConfig } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword, signToken, requireAuth, publicUser } from '../lib/auth.js';
import { logEvent } from '../lib/audit.js';

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
      // First owner account becomes the super admin.
      await client.execute({
        sql: `UPDATE users SET role = 'superadmin' WHERE id = ? AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'superadmin')`,
        args: [newId],
      });
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

    const created = await db.select().from(users).where(eq(users.id, newId)).get();
    await logEvent(req, { action: 'auth.register', actor: created, target: { type: 'user', id: newId, label: normalized } });
    res.json({ token: signToken(created), user: publicUser(created) });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const normalized = username.toLowerCase();
    const user = await db.select().from(users).where(eq(users.username, normalized)).get();
    if (!user || !verifyPassword(password, user.password_hash)) {
      await logEvent(req, { action: 'auth.login_failed', actor: null, target: user ? { type: 'user', id: user.id, label: user.username } : null, details: { username: normalized.slice(0, 40) } });
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    if (user.status === 'suspended') {
      await logEvent(req, { action: 'auth.login_blocked', actor: user, target: { type: 'user', id: user.id, label: user.username } });
      return res.status(403).json({ error: 'This account is suspended. Contact the app administrator.', code: 'suspended' });
    }

    const now = new Date().toISOString();
    await db.update(users).set({ last_login_at: now, last_seen_at: now }).where(eq(users.id, user.id)).run();
    await logEvent(req, { action: 'auth.login', actor: user, target: { type: 'user', id: user.id, label: user.username } });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) { next(err); }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// Full profile: account info + linked programme stats. Requires auth.
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, req.user.id)).get();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const cfg = await db.select().from(appConfig).where(eq(appConfig.user_id, req.user.id)).get();

    // Count logged days for this user
    const daysCount = await client.execute({
      sql: 'SELECT COUNT(*) AS c FROM day_logs WHERE user_id = ?',
      args: [req.user.id],
    });

    res.json({
      id: user.id,
      username: user.username,
      created_at: user.created_at,
      role: user.role || 'user',
      is_owner: user.role === 'superadmin',
      sex: user.sex,
      age: user.age,
      height_cm: user.height_cm,
      activity_level: user.activity_level,
      programme: cfg?.programme || 'carb_cycle',
      start_date: cfg?.start_date || null,
      current_weight_kg: cfg?.current_weight_kg ?? null,
      goal_weight_kg: cfg?.goal_weight_kg ?? null,
      calorie_target: cfg?.calorie_target ?? null,
      protein_g_target: cfg?.protein_g_target ?? null,
      carbs_g_target: cfg?.carbs_g_target ?? null,
      fat_g_target: cfg?.fat_g_target ?? null,
      days_logged: Number(daysCount.rows?.[0]?.c ?? 0),
    });
  } catch (err) { next(err); }
});

// Change own password. Requires current password.
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'current_password and new_password required' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    if (new_password === current_password) {
      return res.status(400).json({ error: 'New password must be different from the current one' });
    }

    const user = await db.select().from(users).where(eq(users.id, req.user.id)).get();
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!verifyPassword(current_password, user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // New password signs out every other device; this one gets a fresh token.
    const token_version = (user.token_version ?? 0) + 1;
    await db.update(users)
      .set({ password_hash: hashPassword(new_password), token_version })
      .where(eq(users.id, req.user.id))
      .run();
    await logEvent(req, { action: 'auth.password_change', target: { type: 'user', id: user.id, label: user.username } });

    res.json({ ok: true, token: signToken({ ...user, token_version }) });
  } catch (err) { next(err); }
});

export default router;
