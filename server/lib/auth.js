import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.warn('[auth] WARNING: JWT_SECRET not set. Auth will not work.');
}

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '90d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  const payload = verifyToken(token);
  if (!payload || !payload.id) return res.status(401).json({ error: 'Invalid token' });

  req.user = { id: payload.id, username: payload.username };
  next();
}
