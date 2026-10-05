import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.warn('[auth] WARNING: JWT_SECRET not set. Auth will not work.');
}

export const ROLES = ['user', 'moderator', 'superadmin'];
export const STAFF_ROLES = ['moderator', 'superadmin'];

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

/** `tv` (token version) lets the server revoke every session for a user at once. */
export function signToken({ id, username, token_version = 0 }) {
  return jwt.sign({ id, username, tv: token_version }, process.env.JWT_SECRET || SECRET, { expiresIn: '90d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || SECRET);
  } catch {
    return null;
  }
}

/** Public shape of a user for API responses. */
export function publicUser(u) {
  return { id: u.id, username: u.username, role: u.role || 'user' };
}

const SEEN_EVERY_MS = 5 * 60 * 1000;
const lastSeenWrite = new Map();

/**
 * Verifies the JWT *and* the account behind it on every request, so suspending
 * a user or bumping their token_version takes effect immediately.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const payload = verifyToken(token);
    if (!payload || !payload.id) return res.status(401).json({ error: 'Invalid token' });

    const user = await db.select().from(users).where(eq(users.id, payload.id)).get();
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });
    if ((payload.tv ?? 0) !== (user.token_version ?? 0)) return res.status(401).json({ error: 'Session expired — please log in again' });
    if (user.status === 'suspended') return res.status(401).json({ error: 'Account suspended', code: 'suspended' });

    req.user = { id: user.id, username: user.username, role: user.role || 'user' };

    // "Last seen" for the admin dashboard, written at most every few minutes per user.
    const now = Date.now();
    if (now - (lastSeenWrite.get(user.id) ?? 0) > SEEN_EVERY_MS) {
      lastSeenWrite.set(user.id, now);
      db.update(users).set({ last_seen_at: new Date(now).toISOString() }).where(eq(users.id, user.id)).run().catch(() => {});
    }
    next();
  } catch (err) { next(err); }
}

/** Use after requireAuth. */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Not allowed' });
    next();
  };
}
