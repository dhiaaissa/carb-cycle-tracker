/**
 * Activity log. Every security-relevant or moderation event goes through here.
 * Never pass secrets (passwords, tokens) in `details`.
 */
import { db } from '../db/index.js';
import { auditLog } from '../db/schema.js';

/** Event names shown in the admin activity log. Keep in sync with client i18n `admin.action.*`. */
export const ACTIONS = [
  'auth.register', 'auth.login', 'auth.login_failed', 'auth.login_blocked', 'auth.password_change',
  'programme.setup', 'programme.adaptive_tdee', 'config.start_date',
  'admin.user_view', 'admin.suspend', 'admin.unsuspend', 'admin.sign_out', 'admin.password_reset',
  'admin.role_change', 'admin.user_delete', 'admin.audit_export',
];

function clientIp(req) {
  const fwd = req?.headers?.['x-forwarded-for'];
  return (typeof fwd === 'string' ? fwd.split(',')[0].trim() : null) || req?.socket?.remoteAddress || null;
}

/**
 * @param {import('express').Request|null} req
 * @param {{ action: string, actor?: {id, username}|null, target?: {type, id, label}|null, details?: object }} e
 */
export async function logEvent(req, { action, actor = req?.user ?? null, target = null, details = {} }) {
  try {
    await db.insert(auditLog).values({
      created_at: new Date().toISOString(),
      actor_id: actor?.id ?? null,
      actor_username: actor?.username ?? null,
      action,
      target_type: target?.type ?? null,
      target_id: target?.id ?? null,
      target_label: target?.label ?? null,
      details_json: JSON.stringify(details ?? {}),
      ip: clientIp(req),
      user_agent: req?.headers?.['user-agent']?.slice(0, 300) ?? null,
    }).run();
  } catch (err) {
    // Logging must never break the request it describes.
    console.error('[audit] failed to record', action, err.message);
  }
}
