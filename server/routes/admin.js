/**
 * Admin & moderation API. Mounted behind requireAuth + requireRole(moderator, superadmin).
 *
 * Moderators: read everything, suspend/unsuspend, sign a user out everywhere.
 * Super admins: everything, plus password resets, role changes and deletion.
 * Nobody can act on themselves, and the last super admin can't be removed.
 */
import { Router } from 'express';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db, client } from '../db/index.js';
import { users, appConfig } from '../db/schema.js';
import { hashPassword, requireRole, ROLES } from '../lib/auth.js';
import { logEvent, ACTIONS } from '../lib/audit.js';

const router = Router();
const superOnly = requireRole('superadmin');

const n = (rows) => Number(rows.rows?.[0]?.n ?? 0);
const daysAgo = (d) => new Date(Date.now() - d * 86_400_000).toISOString();
const asTarget = (u) => ({ type: 'user', id: u.id, label: u.username });

async function loadTarget(req, res) {
  const id = parseInt(req.params.id, 10);
  const target = Number.isFinite(id) ? await db.select().from(users).where(eq(users.id, id)).get() : null;
  if (!target) { res.status(404).json({ error: 'User not found' }); return null; }
  if (target.id === req.user.id) { res.status(400).json({ error: 'You can’t do this to your own account' }); return null; }
  // Moderators can't touch staff; only super admins manage other staff.
  if (target.role !== 'user' && req.user.role !== 'superadmin') { res.status(403).json({ error: 'Only a super admin can manage staff accounts' }); return null; }
  return target;
}

async function superadminCount() {
  return n(await client.execute(`SELECT COUNT(*) AS n FROM users WHERE role = 'superadmin'`));
}

// ── Overview ────────────────────────────────────────────────────────────
router.get('/overview', async (_req, res, next) => {
  try {
    const week = daysAgo(7);
    const [total, active7, new7, suspended, logsTotal, logs7, failed24] = await Promise.all([
      client.execute(`SELECT COUNT(*) AS n FROM users`),
      client.execute({ sql: `SELECT COUNT(*) AS n FROM users WHERE last_seen_at >= ?`, args: [week] }),
      client.execute({ sql: `SELECT COUNT(*) AS n FROM users WHERE created_at >= ?`, args: [week] }),
      client.execute(`SELECT COUNT(*) AS n FROM users WHERE status = 'suspended'`),
      client.execute(`SELECT COUNT(*) AS n FROM day_logs`),
      client.execute({ sql: `SELECT COUNT(*) AS n FROM day_logs WHERE updated_at >= ?`, args: [week] }),
      client.execute({ sql: `SELECT COUNT(*) AS n FROM audit_log WHERE action = 'auth.login_failed' AND created_at >= ?`, args: [daysAgo(1)] }),
    ]);

    const since = daysAgo(30).slice(0, 10);
    const signups = await client.execute({ sql: `SELECT substr(created_at,1,10) AS d, COUNT(*) AS c FROM users WHERE substr(created_at,1,10) >= ? GROUP BY d`, args: [since] });
    const activity = await client.execute({ sql: `SELECT substr(updated_at,1,10) AS d, COUNT(DISTINCT user_id) AS c FROM day_logs WHERE substr(updated_at,1,10) >= ? GROUP BY d`, args: [since] });
    const programmes = await client.execute(`SELECT COALESCE(c.programme,'carb_cycle') AS programme, COUNT(*) AS c FROM users u LEFT JOIN app_config c ON c.user_id = u.id GROUP BY 1 ORDER BY 2 DESC`);

    // A full 30-day series (zero-filled) so the chart has no gaps.
    const byDay = (rows) => Object.fromEntries(rows.rows.map((r) => [r.d, Number(r.c)]));
    const s = byDay(signups), a = byDay(activity);
    const series = Array.from({ length: 30 }, (_, i) => {
      const d = daysAgo(29 - i).slice(0, 10);
      return { date: d, signups: s[d] ?? 0, active: a[d] ?? 0 };
    });

    res.json({
      totals: {
        users: n(total), active_7d: n(active7), new_7d: n(new7), suspended: n(suspended),
        logs: n(logsTotal), logs_7d: n(logs7), failed_logins_24h: n(failed24),
      },
      series,
      programmes: programmes.rows.map((r) => ({ programme: r.programme, count: Number(r.c) })),
    });
  } catch (err) { next(err); }
});

// ── Users ───────────────────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const status = ['active', 'suspended'].includes(req.query.status) ? req.query.status : null;
    const role = ROLES.includes(req.query.role) ? req.query.role : null;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const size = 25;

    const where = [];
    const args = [];
    if (q) { where.push('u.username LIKE ?'); args.push(`%${q}%`); }
    if (status) { where.push('u.status = ?'); args.push(status); }
    if (role) { where.push('u.role = ?'); args.push(role); }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const total = n(await client.execute({ sql: `SELECT COUNT(*) AS n FROM users u ${w}`, args }));
    const rows = await client.execute({
      sql: `SELECT u.id, u.username, u.role, u.status, u.created_at, u.last_login_at, u.last_seen_at,
                   COALESCE(c.programme,'carb_cycle') AS programme,
                   (SELECT COUNT(*) FROM day_logs d WHERE d.user_id = u.id) AS days_logged,
                   (SELECT MAX(date) FROM day_logs d WHERE d.user_id = u.id) AS last_log_date
            FROM users u LEFT JOIN app_config c ON c.user_id = u.id
            ${w}
            ORDER BY COALESCE(u.last_seen_at, u.created_at) DESC
            LIMIT ? OFFSET ?`,
      args: [...args, size, (page - 1) * size],
    });
    res.json({ total, page, size, users: rows.rows.map((r) => ({ ...r, days_logged: Number(r.days_logged) })) });
  } catch (err) { next(err); }
});

router.get('/users/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = await db.select().from(users).where(eq(users.id, id)).get();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const cfg = await db.select().from(appConfig).where(eq(appConfig.user_id, id)).get();
    const logs = await client.execute({
      sql: `SELECT date, day_type, calories_consumed, calories_target, protein_g, water_liters, weight_kg, score
            FROM day_logs WHERE user_id = ? AND date IS NOT NULL ORDER BY date DESC LIMIT 14`,
      args: [id],
    });
    const counts = await client.execute({
      sql: `SELECT COUNT(*) AS days, MIN(date) AS first, MAX(date) AS last, ROUND(AVG(calories_consumed)) AS avg_kcal
            FROM day_logs WHERE user_id = ? AND calories_consumed > 0`,
      args: [id],
    });
    const activity = await client.execute({
      sql: `SELECT id, created_at, action, actor_username, target_label, details_json, ip
            FROM audit_log WHERE target_id = ? AND target_type = 'user' OR actor_id = ?
            ORDER BY created_at DESC LIMIT 30`,
      args: [id, id],
    });

    // One "viewed" entry per admin per user every 10 minutes (refreshes after actions don't spam the log).
    if (user.id !== req.user.id) {
      const recent = n(await client.execute({
        sql: `SELECT COUNT(*) AS n FROM audit_log WHERE action = 'admin.user_view' AND actor_id = ? AND target_id = ? AND created_at >= ?`,
        args: [req.user.id, user.id, new Date(Date.now() - 10 * 60_000).toISOString()],
      }));
      if (!recent) await logEvent(req, { action: 'admin.user_view', target: asTarget(user) });
    }

    const { password_hash, token_version, ...safe } = user;
    res.json({
      user: safe,
      config: cfg ? {
        programme: cfg.programme, start_date: cfg.start_date, goal: cfg.goal, goal_rate_kg_week: cfg.goal_rate_kg_week,
        macro_preset: cfg.macro_preset, current_weight_kg: cfg.current_weight_kg, goal_weight_kg: cfg.goal_weight_kg,
        tdee: cfg.tdee, calorie_target: cfg.calorie_target,
      } : null,
      summary: { ...counts.rows[0], days: Number(counts.rows[0]?.days ?? 0) },
      recent_logs: logs.rows,
      activity: activity.rows.map((r) => ({ ...r, details: JSON.parse(r.details_json || '{}'), details_json: undefined })),
    });
  } catch (err) { next(err); }
});

router.post('/users/:id/suspend', async (req, res, next) => {
  try {
    const target = await loadTarget(req, res);
    if (!target) return;
    const reason = String(req.body?.reason || '').trim().slice(0, 300) || null;
    await db.update(users).set({ status: 'suspended', suspended_reason: reason, token_version: (target.token_version ?? 0) + 1 })
      .where(eq(users.id, target.id)).run();
    await logEvent(req, { action: 'admin.suspend', target: asTarget(target), details: { reason } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/users/:id/unsuspend', async (req, res, next) => {
  try {
    const target = await loadTarget(req, res);
    if (!target) return;
    await db.update(users).set({ status: 'active', suspended_reason: null }).where(eq(users.id, target.id)).run();
    await logEvent(req, { action: 'admin.unsuspend', target: asTarget(target) });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/users/:id/sign-out', async (req, res, next) => {
  try {
    const target = await loadTarget(req, res);
    if (!target) return;
    await db.update(users).set({ token_version: (target.token_version ?? 0) + 1 }).where(eq(users.id, target.id)).run();
    await logEvent(req, { action: 'admin.sign_out', target: asTarget(target) });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/users/:id/reset-password', superOnly, async (req, res, next) => {
  try {
    const target = await loadTarget(req, res);
    if (!target) return;
    // Shown once to the admin; never stored or logged in plain text.
    const temp = crypto.randomBytes(9).toString('base64url');
    await db.update(users).set({ password_hash: hashPassword(temp), token_version: (target.token_version ?? 0) + 1 })
      .where(eq(users.id, target.id)).run();
    await logEvent(req, { action: 'admin.password_reset', target: asTarget(target) });
    res.json({ ok: true, temporary_password: temp });
  } catch (err) { next(err); }
});

router.post('/users/:id/role', superOnly, async (req, res, next) => {
  try {
    const target = await loadTarget(req, res);
    if (!target) return;
    const role = req.body?.role;
    if (!ROLES.includes(role)) return res.status(400).json({ error: `role must be one of ${ROLES.join(', ')}` });
    if (target.role === 'superadmin' && role !== 'superadmin' && (await superadminCount()) <= 1) {
      return res.status(400).json({ error: 'There must always be at least one super admin' });
    }
    await db.update(users).set({ role }).where(eq(users.id, target.id)).run();
    await logEvent(req, { action: 'admin.role_change', target: asTarget(target), details: { from: target.role, to: role } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/users/:id', superOnly, async (req, res, next) => {
  try {
    const target = await loadTarget(req, res);
    if (!target) return;
    if (req.body?.confirm !== target.username) return res.status(400).json({ error: 'Type the username to confirm deletion' });
    if (target.role === 'superadmin' && (await superadminCount()) <= 1) {
      return res.status(400).json({ error: 'There must always be at least one super admin' });
    }
    const counts = n(await client.execute({ sql: `SELECT COUNT(*) AS n FROM day_logs WHERE user_id = ?`, args: [target.id] }));
    await client.batch([
      { sql: `DELETE FROM day_logs WHERE user_id = ?`, args: [target.id] },
      { sql: `DELETE FROM custom_foods WHERE user_id = ?`, args: [target.id] },
      { sql: `DELETE FROM meal_presets WHERE user_id = ?`, args: [target.id] },
      { sql: `DELETE FROM app_config WHERE user_id = ?`, args: [target.id] },
      { sql: `DELETE FROM users WHERE id = ?`, args: [target.id] },
    ], 'write');
    // The log entry outlives the account (target_label keeps the username).
    await logEvent(req, { action: 'admin.user_delete', target: asTarget(target), details: { days_deleted: counts } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── Activity log ────────────────────────────────────────────────────────
function auditQuery(query) {
  const where = [];
  const args = [];
  if (ACTIONS.includes(query.action)) { where.push('action = ?'); args.push(query.action); }
  if (query.category && /^[a-z]+$/.test(query.category)) { where.push('action LIKE ?'); args.push(`${query.category}.%`); }
  if (query.q) { where.push('(actor_username LIKE ? OR target_label LIKE ? OR ip LIKE ?)'); const v = `%${String(query.q).slice(0, 40)}%`; args.push(v, v, v); }
  if (query.user_id) { where.push('(actor_id = ? OR (target_type = \'user\' AND target_id = ?))'); args.push(Number(query.user_id), Number(query.user_id)); }
  return { w: where.length ? `WHERE ${where.join(' AND ')}` : '', args };
}

router.get('/audit', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const size = 50;
    const { w, args } = auditQuery(req.query);
    const total = n(await client.execute({ sql: `SELECT COUNT(*) AS n FROM audit_log ${w}`, args }));
    const rows = await client.execute({ sql: `SELECT * FROM audit_log ${w} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`, args: [...args, size, (page - 1) * size] });
    res.json({
      total, page, size, actions: ACTIONS,
      entries: rows.rows.map((r) => ({ ...r, details: JSON.parse(r.details_json || '{}'), details_json: undefined })),
    });
  } catch (err) { next(err); }
});

router.get('/audit.csv', async (req, res, next) => {
  try {
    const { w, args } = auditQuery(req.query);
    const rows = await client.execute({ sql: `SELECT * FROM audit_log ${w} ORDER BY created_at DESC LIMIT 10000`, args });
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['time', 'action', 'actor', 'target', 'details', 'ip'].join(',')];
    for (const r of rows.rows) lines.push([r.created_at, r.action, r.actor_username, r.target_label, r.details_json, r.ip].map(esc).join(','));
    await logEvent(req, { action: 'admin.audit_export', details: { rows: rows.rows.length } });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="activity-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(lines.join('\n'));
  } catch (err) { next(err); }
});

export default router;
