import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MagnifyingGlass, X, SignOut, Prohibit, CheckCircle, Key, Trash, DownloadSimple, Copy, Check, ShieldCheck, Warning,
} from '@phosphor-icons/react';
import { api, auth } from '../lib/api';
import { formatDate, formatNumber } from '../lib/format';
import { PageHeader, Panel, Ledger, Tabs, TextButton, EmptyState } from './ui/primitives';

const ROLE_CHIP = {
  superadmin: 'bg-door-600 text-white border-door-600',
  moderator: 'bg-door-50 text-door-800 border-door-200',
  user: 'bg-ink-50 text-ink-700 border-ink-200',
};

function useRelative() {
  const { i18n } = useTranslation();
  return (iso) => {
    if (!iso) return '—';
    const diff = (Date.parse(iso) - Date.now()) / 1000;
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' });
    const abs = Math.abs(diff);
    if (abs < 60) return rtf.format(Math.round(diff), 'second');
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
    if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
    return formatDate(iso, { day: 'numeric', month: 'short', year: 'numeric' });
  };
}

function RoleChip({ role }) {
  const { t } = useTranslation();
  return <span className={`inline-flex text-[11px] font-semibold px-1.5 py-0.5 rounded-md border ${ROLE_CHIP[role] || ROLE_CHIP.user}`}>{t(`admin.role.${role || 'user'}`)}</span>;
}

function StatusChip({ status }) {
  const { t } = useTranslation();
  return status === 'suspended'
    ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-clay-700"><Prohibit size={12} weight="bold" aria-hidden="true" />{t('admin.status.suspended')}</span>
    : <span className="text-[11px] text-ink-500">{t('admin.status.active')}</span>;
}

const actionLabel = (t, action) => t(`admin.action.${action.replace('.', '_')}`, { defaultValue: action });

// ── Overview ────────────────────────────────────────────────────────────
function Overview() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [hover, setHover] = useState(null);
  const [asTable, setAsTable] = useState(false);
  useEffect(() => { api.admin.overview().then(setData).catch(console.error); }, []);
  if (!data) return <p className="text-sm text-ink-500" role="status">{t('app.loading')}</p>;

  const { totals, series, programmes } = data;
  const max = Math.max(1, ...series.map((d) => d.active));
  const totalUsers = programmes.reduce((s, p) => s + p.count, 0) || 1;

  return (
    <div className="space-y-6">
      <Ledger items={[
        { label: t('admin.stat.users'), value: formatNumber(totals.users) },
        { label: t('admin.stat.active7'), value: formatNumber(totals.active_7d) },
        { label: t('admin.stat.new7'), value: formatNumber(totals.new_7d) },
        { label: t('admin.stat.suspended'), value: formatNumber(totals.suspended) },
      ]} />
      <Ledger items={[
        { label: t('admin.stat.logs'), value: formatNumber(totals.logs) },
        { label: t('admin.stat.logs7'), value: formatNumber(totals.logs_7d) },
        { label: t('admin.stat.failed24'), value: formatNumber(totals.failed_logins_24h) },
      ]} />

      <Panel title={t('admin.chart.title')}
        action={<TextButton onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>{asTable ? t('insights.showChart') : t('insights.showTable')}</TextButton>}>
        {asTable ? (
          <div className="max-h-72 overflow-y-auto" data-scroll>
            <table className="w-full text-sm tabular-nums">
              <thead><tr className="text-xs text-ink-500 border-b border-ink-200">
                <th className="py-2 text-start font-medium">{t('weight.date')}</th>
                <th className="py-2 text-end font-medium">{t('admin.chart.active')}</th>
                <th className="py-2 text-end font-medium">{t('admin.chart.signups')}</th>
              </tr></thead>
              <tbody className="divide-y divide-ink-200">
                {[...series].reverse().map((d) => (
                  <tr key={d.date}><td className="py-1.5 text-ink-900">{formatDate(d.date + 'T12:00:00', { day: 'numeric', month: 'short' })}</td>
                    <td className="py-1.5 text-end text-ink-900">{d.active}</td><td className="py-1.5 text-end text-ink-600">{d.signups}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="relative h-40 flex items-end gap-[2px]" role="img" aria-label={t('admin.chart.aria')} onPointerLeave={() => setHover(null)}>
              {series.map((d, i) => (
                <div key={d.date} className="relative flex-1 h-full flex flex-col justify-end" onPointerEnter={() => setHover(i)}>
                  <div className="w-full rounded-t-[3px] bg-door-600 min-h-[2px]" style={{ height: `${(d.active / max) * 100}%` }} />
                  {d.signups > 0 && <span aria-hidden="true" className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-saffron-500" />}
                </div>
              ))}
              {hover != null && (
                <div className="pointer-events-none absolute -top-2 rounded-md border border-ink-200 bg-white px-2 py-1 text-xs tabular-nums shadow-[0_4px_12px_rgb(0_0_0/0.1)]"
                  style={{ left: `clamp(0px, calc(${(hover / series.length) * 100}% - 60px), calc(100% - 140px))`, width: 140 }}>
                  <div className="text-ink-500">{formatDate(series[hover].date + 'T12:00:00', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                  <div className="text-ink-900">{t('admin.chart.activeN', { count: series[hover].active })}</div>
                  <div className="text-ink-600">{t('admin.chart.signupsN', { count: series[hover].signups })}</div>
                </div>
              )}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-5 text-xs text-ink-600" aria-label={t('log.legend')}>
              <li className="flex items-center gap-1.5"><span aria-hidden="true" className="w-2.5 h-2.5 rounded-[2px] bg-door-600" />{t('admin.chart.active')}</li>
              <li className="flex items-center gap-1.5"><span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-saffron-500" />{t('admin.chart.signupDay')}</li>
            </ul>
          </>
        )}
      </Panel>

      <Panel title={t('admin.programmes')}>
        <ul className="space-y-2.5">
          {programmes.map((p) => (
            <li key={p.programme} className="flex items-center gap-3 text-sm">
              <span className="w-36 shrink-0 text-ink-700">{t(`programme.${p.programme === 'recomp' ? 'body_recomp' : p.programme}`)}</span>
              <div className="flex-1 h-2 rounded-full bg-ink-100"><div className="h-2 rounded-full bg-door-600" style={{ width: `${(p.count / totalUsers) * 100}%` }} /></div>
              <span className="w-10 text-end font-semibold text-ink-900 tabular-nums">{p.count}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

// ── Users ───────────────────────────────────────────────────────────────
function Users({ me, onOpen, refresh }) {
  const { t } = useTranslation();
  const rel = useRelative();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => api.admin.users({ q, status, role, page }).then(setData).catch(console.error), [q, status, role, page, refresh]);
  useEffect(() => { const id = setTimeout(load, 200); return () => clearTimeout(id); }, [load]);

  const select = 'h-10 px-2 rounded-lg border border-ink-300 bg-white text-sm text-ink-900 outline-none focus:border-door-600';
  const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

  return (
    <Panel bodyClassName="">
      <div className="flex flex-wrap gap-2 p-4 border-b border-ink-200">
        <label className="relative flex-1 min-w-[180px]">
          <span className="sr-only">{t('admin.searchUsers')}</span>
          <MagnifyingGlass size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={t('admin.searchUsers')}
            className="w-full h-10 ps-9 pe-3 rounded-lg border border-ink-300 bg-white text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-door-600 focus:ring-2 focus:ring-door-200" />
        </label>
        <select aria-label={t('admin.filterStatus')} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={select}>
          <option value="">{t('admin.allStatuses')}</option>
          <option value="active">{t('admin.status.active')}</option>
          <option value="suspended">{t('admin.status.suspended')}</option>
        </select>
        <select aria-label={t('admin.filterRole')} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className={select}>
          <option value="">{t('admin.allRoles')}</option>
          {['user', 'moderator', 'superadmin'].map((r) => <option key={r} value={r}>{t(`admin.role.${r}`)}</option>)}
        </select>
      </div>

      {!data ? <p className="p-5 text-sm text-ink-500" role="status">{t('app.loading')}</p> : data.users.length === 0 ? (
        <p className="p-5 text-sm text-ink-500">{t('admin.noUsers')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-ink-500 border-b border-ink-200">
              <th className="px-4 py-2.5 text-start font-medium">{t('admin.col.user')}</th>
              <th className="px-3 py-2.5 text-start font-medium hidden md:table-cell">{t('admin.col.programme')}</th>
              <th className="px-3 py-2.5 text-end font-medium">{t('admin.col.days')}</th>
              <th className="px-3 py-2.5 text-end font-medium hidden sm:table-cell">{t('admin.col.lastSeen')}</th>
              <th className="px-4 py-2.5 text-end font-medium hidden lg:table-cell">{t('admin.col.joined')}</th>
            </tr></thead>
            <tbody className="divide-y divide-ink-200">
              {data.users.map((u) => (
                <tr key={u.id} onClick={() => onOpen(u.id)} className="cursor-pointer hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <button type="button" className="text-start" onClick={(e) => { e.stopPropagation(); onOpen(u.id); }}>
                      <span className="font-semibold text-ink-900">@{u.username}</span>
                      {u.id === me.id && <span className="ms-1.5 text-xs text-ink-500">({t('admin.you')})</span>}
                    </button>
                    <div className="flex items-center gap-2 mt-0.5"><RoleChip role={u.role} /><StatusChip status={u.status} /></div>
                  </td>
                  <td className="px-3 py-3 text-ink-700 hidden md:table-cell">{t(`programme.${u.programme === 'recomp' ? 'body_recomp' : u.programme}`)}</td>
                  <td className="px-3 py-3 text-end text-ink-900 tabular-nums">{u.days_logged}</td>
                  <td className="px-3 py-3 text-end text-ink-600 hidden sm:table-cell">{rel(u.last_seen_at)}</td>
                  <td className="px-4 py-3 text-end text-ink-500 hidden lg:table-cell">{formatDate(u.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-ink-200 text-sm text-ink-600">
          <span className="tabular-nums">{t('admin.pageOf', { page, pages, total: data.total })}</span>
          <div className="flex gap-4">
            <TextButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('admin.prev')}</TextButton>
            <TextButton disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>{t('admin.next')}</TextButton>
          </div>
        </div>
      )}
    </Panel>
  );
}

// ── User detail sheet ───────────────────────────────────────────────────
function UserSheet({ id, me, onClose, onChanged }) {
  const { t } = useTranslation();
  const rel = useRelative();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reason, setReason] = useState('');
  const [tempPw, setTempPw] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [roleDraft, setRoleDraft] = useState('');

  const load = useCallback(() => api.admin.user(id).then((d) => { setData(d); setRoleDraft(d.user.role); }).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function run(fn, doneMsg) {
    setBusy(true); setError(''); setNotice('');
    try { const r = await fn(); if (doneMsg) setNotice(doneMsg); await load(); onChanged(); return r; }
    catch (e) { setError(e.message); return null; }
    finally { setBusy(false); }
  }

  const u = data?.user;
  const isSelf = u?.id === me.id;
  const isSuper = me.role === 'superadmin';
  const canModerate = u && !isSelf && (u.role === 'user' || isSuper);
  const btn = 'h-10 px-3 rounded-lg border border-ink-200 bg-white hover:bg-ink-100 text-sm font-semibold text-ink-900 flex items-center gap-2 disabled:opacity-50';
  const field = 'h-10 px-3 rounded-lg border border-ink-300 bg-white text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-door-600 focus:ring-2 focus:ring-door-200';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-labelledby="user-sheet-title" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl h-full bg-page border-s border-ink-200 flex flex-col">
        <div className="h-16 px-5 flex items-center justify-between border-b border-ink-200 bg-white shrink-0 pt-safe">
          <h2 id="user-sheet-title" className="font-display text-xl font-semibold text-ink-900 truncate">{u ? `@${u.username}` : t('app.loading')}</h2>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="w-10 h-10 -me-2 flex items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-safe" data-scroll>
          {error && <div role="alert" className="flex gap-2 text-sm text-clay-700 bg-clay-50 border border-clay-200 rounded-lg p-3"><Warning size={18} className="shrink-0" />{error}</div>}
          {notice && <div role="status" className="text-sm text-olive-800 bg-olive-50 border border-olive-200 rounded-lg p-3">{notice}</div>}
          {!data ? null : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <RoleChip role={u.role} /><StatusChip status={u.status} />
                <span className="text-xs text-ink-500">{t('admin.joined', { date: formatDate(u.created_at, { day: 'numeric', month: 'short', year: 'numeric' }) })}</span>
              </div>
              {u.status === 'suspended' && u.suspended_reason && <p className="text-sm text-clay-700">{t('admin.reasonShown', { reason: u.suspended_reason })}</p>}

              <Ledger items={[
                { label: t('admin.col.days'), value: data.summary.days },
                { label: t('admin.avgKcal'), value: data.summary.avg_kcal ? formatNumber(data.summary.avg_kcal) : '—' },
                { label: t('admin.lastLogin'), value: <span className="text-base">{rel(u.last_login_at)}</span> },
                { label: t('admin.col.lastSeen'), value: <span className="text-base">{rel(u.last_seen_at)}</span> },
              ]} />

              <Panel title={t('admin.profile')} bodyClassName="px-5 pb-4 pt-2">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {[
                    [t('admin.col.programme'), data.config ? t(`programme.${data.config.programme === 'recomp' ? 'body_recomp' : data.config.programme}`) : '—'],
                    [t('profile.field.startDate'), data.config?.start_date ?? '—'],
                    [t('profile.field.sex'), u.sex ? t(`profile.sex.${u.sex}`) : '—'],
                    [t('profile.field.age'), u.age ?? '—'],
                    [t('profile.field.currentWeight'), data.config?.current_weight_kg ? `${data.config.current_weight_kg} kg` : '—'],
                    [t('profile.field.goalWeight'), data.config?.goal_weight_kg ? `${data.config.goal_weight_kg} kg` : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 border-b border-ink-200 py-1.5"><dt className="text-ink-500">{k}</dt><dd className="text-ink-900 tabular-nums">{v}</dd></div>
                  ))}
                </dl>
              </Panel>

              {data.recent_logs.length > 0 && (
                <Panel title={t('admin.recentLogs')} bodyClassName="px-5 pb-4 pt-2">
                  <table className="w-full text-sm tabular-nums">
                    <tbody className="divide-y divide-ink-200">
                      {data.recent_logs.map((l) => (
                        <tr key={l.date}>
                          <td className="py-1.5 text-ink-900">{formatDate(l.date + 'T12:00:00', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                          <td className="py-1.5 text-end text-ink-700">{formatNumber(Math.round(l.calories_consumed))} / {formatNumber(Math.round(l.calories_target))}</td>
                          <td className="py-1.5 text-end text-ink-500">{l.weight_kg ? `${l.weight_kg} kg` : ''}</td>
                          <td className="py-1.5 text-end text-ink-900 font-semibold">{l.score}/5</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
              )}

              <Panel title={t('admin.actions')}>
                {!canModerate ? (
                  <p className="text-sm text-ink-500 -mt-1">{isSelf ? t('admin.cantSelf') : t('admin.staffOnlySuper')}</p>
                ) : (
                  <div className="space-y-5 -mt-1">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={btn} disabled={busy} onClick={() => run(() => api.admin.signOut(u.id), t('admin.done.signOut'))}>
                        <SignOut size={16} aria-hidden="true" />{t('admin.signOut')}
                      </button>
                      {u.status === 'suspended' ? (
                        <button type="button" className={btn} disabled={busy} onClick={() => run(() => api.admin.unsuspend(u.id), t('admin.done.unsuspend'))}>
                          <CheckCircle size={16} aria-hidden="true" />{t('admin.unsuspend')}
                        </button>
                      ) : null}
                    </div>

                    {u.status !== 'suspended' && (
                      <div>
                        <label htmlFor="suspend-reason" className="block text-sm font-medium text-ink-700 mb-1.5">{t('admin.suspendReason')}</label>
                        <div className="flex gap-2">
                          <input id="suspend-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('admin.suspendReasonPh')} className={`${field} flex-1`} maxLength={300} />
                          <button type="button" disabled={busy} onClick={() => run(() => api.admin.suspend(u.id, reason), t('admin.done.suspend'))}
                            className="h-10 px-3 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                            <Prohibit size={16} aria-hidden="true" />{t('admin.suspend')}
                          </button>
                        </div>
                      </div>
                    )}

                    {isSuper && (
                      <>
                        <div>
                          <div className="text-sm font-medium text-ink-700 mb-1.5">{t('admin.password')}</div>
                          {tempPw ? (
                            <div className="rounded-lg border border-saffron-200 bg-saffron-50 p-3 text-sm">
                              <p className="text-ink-800 mb-2">{t('admin.tempPwNote')}</p>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 font-mono text-base text-ink-900 bg-white border border-ink-200 rounded-md px-2 py-1 select-all">{tempPw}</code>
                                <button type="button" className={btn} onClick={async () => { try { await navigator.clipboard.writeText(tempPw); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }}>
                                  {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? t('grocery.copied') : t('admin.copy')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button type="button" className={btn} disabled={busy}
                              onClick={async () => { if (!window.confirm(t('admin.confirmReset', { name: u.username }))) return; const r = await run(() => api.admin.resetPassword(u.id)); if (r?.temporary_password) setTempPw(r.temporary_password); }}>
                              <Key size={16} aria-hidden="true" />{t('admin.resetPassword')}
                            </button>
                          )}
                        </div>

                        <div>
                          <label htmlFor="role-select" className="block text-sm font-medium text-ink-700 mb-1.5">{t('admin.role.label')}</label>
                          <div className="flex gap-2">
                            <select id="role-select" value={roleDraft} onChange={(e) => setRoleDraft(e.target.value)} className={field}>
                              {['user', 'moderator', 'superadmin'].map((r) => <option key={r} value={r}>{t(`admin.role.${r}`)}</option>)}
                            </select>
                            <button type="button" className={btn} disabled={busy || roleDraft === u.role}
                              onClick={() => run(() => api.admin.setRole(u.id, roleDraft), t('admin.done.role'))}>
                              <ShieldCheck size={16} aria-hidden="true" />{t('admin.saveRole')}
                            </button>
                          </div>
                          <p className="text-xs text-ink-500 mt-1.5">{t('admin.roleHelp')}</p>
                        </div>

                        <div className="pt-4 border-t border-ink-200">
                          <label htmlFor="delete-confirm" className="block text-sm font-medium text-clay-700 mb-1.5">{t('admin.deleteTitle')}</label>
                          <p className="text-xs text-ink-600 mb-2">{t('admin.deleteHelp', { name: u.username })}</p>
                          <div className="flex gap-2">
                            <input id="delete-confirm" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder={u.username} autoCapitalize="none" autoCorrect="off" className={`${field} flex-1`} />
                            <button type="button" disabled={busy || confirmName !== u.username}
                              onClick={async () => { const r = await run(() => api.admin.remove(u.id, confirmName)); if (r) onClose(); }}
                              className="h-10 px-3 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-40">
                              <Trash size={16} aria-hidden="true" />{t('admin.delete')}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Panel>

              <Panel title={t('admin.userActivity')} bodyClassName="px-5 pb-4 pt-2">
                {data.activity.length === 0 ? <p className="text-sm text-ink-500">{t('admin.noActivity')}</p> : (
                  <ol className="divide-y divide-ink-200">
                    {data.activity.map((e) => (
                      <li key={e.id} className="py-2 text-sm flex justify-between gap-3">
                        <span className="text-ink-900">{actionLabel(t, e.action)}{e.actor_username && e.actor_username !== u.username && <span className="text-ink-500"> · @{e.actor_username}</span>}</span>
                        <span className="text-ink-500 shrink-0">{rel(e.created_at)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

// ── Activity log ────────────────────────────────────────────────────────
function Activity() {
  const { t } = useTranslation();
  const rel = useRelative();
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => api.admin.audit({ category, q, page }).then(setData).catch(console.error), 200);
    return () => clearTimeout(id);
  }, [category, q, page]);

  async function exportCsv() {
    const blob = await api.admin.auditCsv({ category, q });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `activity-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;
  const detailText = (e) => {
    const d = e.details || {};
    if (e.action === 'admin.role_change') return t('admin.detail.role', { from: t(`admin.role.${d.from}`), to: t(`admin.role.${d.to}`) });
    if (e.action === 'admin.suspend' && d.reason) return d.reason;
    if (e.action === 'config.start_date') return `${d.from} → ${d.to}`;
    if (e.action === 'programme.setup' && d.programme) return t(`programme.${d.programme === 'recomp' ? 'body_recomp' : d.programme}`);
    if (e.action === 'auth.login_failed' && d.username) return t('admin.detail.attempted', { name: d.username });
    return '';
  };

  return (
    <Panel bodyClassName="">
      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-ink-200">
        <div className="flex gap-1.5 overflow-x-auto" role="radiogroup" aria-label={t('admin.filterCategory')}>
          {['', 'auth', 'admin', 'programme', 'config'].map((c) => (
            <button key={c || 'all'} type="button" role="radio" aria-checked={category === c} onClick={() => { setCategory(c); setPage(1); }}
              className={`h-8 px-3 shrink-0 rounded-md text-sm border ${category === c ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-100'}`}>
              {t(`admin.cat.${c || 'all'}`)}
            </button>
          ))}
        </div>
        <label className="relative ms-auto">
          <span className="sr-only">{t('admin.searchActivity')}</span>
          <MagnifyingGlass size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={t('admin.searchActivity')}
            className="h-9 w-48 ps-9 pe-3 rounded-lg border border-ink-300 bg-white text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-door-600" />
        </label>
        <button type="button" onClick={exportCsv} className="h-9 px-3 rounded-lg border border-ink-200 bg-white hover:bg-ink-100 text-sm font-semibold text-ink-900 flex items-center gap-2">
          <DownloadSimple size={16} aria-hidden="true" />CSV
        </button>
      </div>

      {!data ? <p className="p-5 text-sm text-ink-500" role="status">{t('app.loading')}</p> : data.entries.length === 0 ? (
        <EmptyState title={t('admin.noActivity')} />
      ) : (
        <ol className="divide-y divide-ink-200">
          {data.entries.map((e) => {
            const warn = e.action === 'auth.login_failed' || e.action === 'auth.login_blocked' || e.action === 'admin.user_delete' || e.action === 'admin.suspend';
            return (
              <li key={e.id} className="px-4 py-3 flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-sm">
                <span className="w-28 shrink-0 text-ink-500 tabular-nums" title={new Date(e.created_at).toLocaleString()}>{rel(e.created_at)}</span>
                <span className={`font-semibold ${warn ? 'text-clay-700' : 'text-ink-900'}`}>{actionLabel(t, e.action)}</span>
                <span className="text-ink-600">
                  {e.actor_username ? `@${e.actor_username}` : t('admin.anonymous')}
                  {e.target_label && e.target_label !== e.actor_username && <> → <span className="text-ink-900">@{e.target_label}</span></>}
                </span>
                {detailText(e) && <span className="text-ink-500">{detailText(e)}</span>}
                <span className="ms-auto text-xs text-ink-400 tabular-nums">{e.ip}</span>
              </li>
            );
          })}
        </ol>
      )}

      {data && pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-ink-200 text-sm text-ink-600">
          <span className="tabular-nums">{t('admin.pageOf', { page, pages, total: data.total })}</span>
          <div className="flex gap-4">
            <TextButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('admin.prev')}</TextButton>
            <TextButton disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>{t('admin.next')}</TextButton>
          </div>
        </div>
      )}
    </Panel>
  );
}

export default function AdminPage() {
  const { t } = useTranslation();
  const me = auth.getUser() || {};
  const [tab, setTab] = useState('overview');
  const [openId, setOpenId] = useState(null);
  const [refresh, setRefresh] = useState(0);

  if (me.role !== 'superadmin' && me.role !== 'moderator') {
    return <EmptyState icon={ShieldCheck} title={t('admin.noAccess')} />;
  }

  return (
    <div>
      <PageHeader eyebrow={t(`admin.role.${me.role}`)} title={t('admin.title')} subtitle={t('admin.subtitle')} />
      <Tabs label={t('admin.title')} value={tab} onChange={setTab}
        tabs={[{ key: 'overview', label: t('admin.tab.overview') }, { key: 'users', label: t('admin.tab.users') }, { key: 'activity', label: t('admin.tab.activity') }]} />
      {tab === 'overview' && <Overview />}
      {tab === 'users' && <Users me={me} onOpen={setOpenId} refresh={refresh} />}
      {tab === 'activity' && <Activity />}
      {openId != null && <UserSheet id={openId} me={me} onClose={() => setOpenId(null)} onChanged={() => setRefresh((n) => n + 1)} />}
    </div>
  );
}
