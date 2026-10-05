import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Lightbulb, TrendDown, TrendUp, Minus } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { formatDate, formatNumber } from '../lib/format';
import { localIsoDate } from '../../../shared/dates.js';
import { Panel } from './ui/primitives';

const ICON = {
  good: { Icon: CheckCircle, cls: 'text-olive-600', weight: 'fill' },
  nudge: { Icon: Lightbulb, cls: 'text-door-600', weight: 'regular' },
};
const WEIGHT_ICON = { weight_down: TrendDown, weight_up: TrendUp, weight_flat: Minus };

/** "Last 7 days" — a few plain findings with a next step, never a grade. */
export default function WeeklyInsightsCard({ className = 'mb-6' }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);

  useEffect(() => { api.getWeekly(localIsoDate()).then(setData).catch(() => {}); }, []);
  if (!data) return null;

  const fmt = (d) => formatDate(d + 'T12:00:00', { day: 'numeric', month: 'short' });
  const params = (p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === 'number' && Math.abs(v) >= 1000 ? formatNumber(v) : v]));

  return (
    <Panel
      className={className}
      title={t('weekly.title')}
      action={<span className="text-xs text-ink-500 tabular-nums">{fmt(data.from)} – {fmt(data.to)}</span>}
    >
      <ul className="space-y-3 -mt-1">
        {data.findings.map((f) => {
          const { Icon, cls, weight } = WEIGHT_ICON[f.code]
            ? { Icon: WEIGHT_ICON[f.code], cls: 'text-ink-500', weight: 'bold' }
            : ICON[f.tone] ?? ICON.nudge;
          return (
            <li key={f.code} className="flex gap-3 text-sm text-ink-800 leading-relaxed">
              <Icon size={20} weight={weight} className={`${cls} shrink-0 mt-px`} aria-hidden="true" />
              <span>{t(`weekly.${f.code}`, params(f.params))}</span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
