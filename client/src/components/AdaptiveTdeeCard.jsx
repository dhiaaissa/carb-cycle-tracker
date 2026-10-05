import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gauge, Hourglass } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { formatNumber } from '../lib/format';
import { localIsoDate } from '../../../shared/dates.js';
import { Panel, TextButton } from './ui/primitives';

/**
 * Adaptive TDEE: after 2–4 weeks of logging, compare what the user actually ate
 * with how their trend weight moved, and offer to update the targets.
 * While there isn't enough data, a quiet line explains what's still needed.
 */
export default function AdaptiveTdeeCard({ className = 'mb-6' }) {
  const { t } = useTranslation();
  const [a, setA] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => { api.getProgress(localIsoDate(), 28).then((p) => setA(p.adaptive)).catch(() => {}); }, []);
  if (!a) return null;

  if (a.status === 'insufficient') {
    if (!a.have) return null; // brand-new account: nothing useful to say yet
    return (
      <p className={`flex items-start gap-2.5 text-sm text-ink-600 px-1 ${className}`}>
        <Hourglass size={18} className="text-ink-400 shrink-0 mt-px" aria-hidden="true" />
        <span>{t(`adaptive.learning.${a.reason}`, { left: Math.max(1, a.need - a.have), have: a.have, need: a.need })}</span>
      </p>
    );
  }
  if (done) {
    return (
      <Panel className={`${className} border-olive-200`} title={t('adaptive.doneTitle')}>
        <div className="-mt-1 space-y-2 text-sm text-ink-800" role="status">
          <p>{done.calorie_target
            ? t('adaptive.doneTarget', { tdee: formatNumber(done.tdee), target: formatNumber(done.calorie_target) })
            : t('adaptive.doneCycle', { tdee: formatNumber(done.tdee) })}</p>
          {done.warnings?.map((w) => <p key={w.code} className="text-saffron-800">{t(`setup.warning.${w.code}`, w)}</p>)}
          <button type="button" onClick={() => window.location.reload()}
            className="mt-2 h-10 px-4 rounded-lg border border-ink-200 bg-white hover:bg-ink-100 text-sm font-semibold text-ink-900">{t('adaptive.seeTargets')}</button>
        </div>
      </Panel>
    );
  }
  if (!a.show) return null;

  const diff = a.differsFromFormula ?? 0;
  const change = a.trendChangeKgPerWeek;

  async function accept() {
    setBusy(true); setError('');
    try {
      setDone(await api.acceptAdaptive(localIsoDate()));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function dismiss() {
    setA({ ...a, show: false });
    api.dismissAdaptive().catch(() => {});
  }

  return (
    <Panel className={`${className} border-door-200`} title={
      <span className="flex items-center gap-2"><Gauge size={20} className="text-door-600" aria-hidden="true" />{t('adaptive.title')}</span>
    }>
      <div className="-mt-1 space-y-3">
        <p className="text-sm text-ink-800 leading-relaxed">
          {t('adaptive.body', {
            days: a.spanDays,
            intake: formatNumber(a.avgIntake),
            change: `${change > 0 ? '+' : ''}${change}`,
          })}
        </p>
        <div className="flex items-baseline gap-3">
          <span className="font-display text-3xl font-semibold text-ink-900 tabular-nums">{formatNumber(a.tdee)}</span>
          <span className="text-sm text-ink-500">{t('adaptive.perDay')}</span>
          <span className="text-sm font-semibold text-door-700 tabular-nums">
            {t(diff > 0 ? 'adaptive.more' : 'adaptive.less', { kcal: formatNumber(Math.abs(diff)) })}
          </span>
        </div>
        <p className="text-xs text-ink-500">{t(`adaptive.confidence.${a.confidence}`, { days: a.intakeDays, weighIns: a.weighIns })}</p>
        {error && <p role="alert" className="text-sm text-clay-700">{error}</p>}
        <div className="flex items-center gap-4 pt-1">
          <button type="button" onClick={accept} disabled={busy}
            className="h-10 px-4 rounded-lg bg-door-600 hover:bg-door-700 text-white text-sm font-semibold disabled:opacity-60">
            {busy ? t('settings.saving') : t('adaptive.accept')}
          </button>
          <TextButton onClick={dismiss}>{t('adaptive.dismiss')}</TextButton>
        </div>
      </div>
    </Panel>
  );
}
