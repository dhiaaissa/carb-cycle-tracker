import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../lib/format';
import { PageHeader, Panel, Ledger } from './ui/primitives';
import WeeklyInsightsCard from './WeeklyInsightsCard';

export default function MacroInsights({ stats, config }) {
  const { t } = useTranslation();
  const target = config?.day_targets?.flat?.calories || 0;
  const protTarget = config?.day_targets?.flat?.protein_g || 0;

  // Hooks before any early return.
  const weeks = useMemo(() => (stats?.weekly_summary || []).map((ws) => ({
    ...ws,
    adherence_pct: ws.completed_days ? Math.round((ws.good_days / ws.completed_days) * 100) : 0,
    cal_diff: target && ws.avg_calories ? ws.avg_calories - target : null,
  })), [stats, target]);

  if (!stats) return <p className="text-sm text-ink-500" role="status">{t('macroInsights.loading')}</p>;

  const bestWeek = weeks.filter((w) => w.completed_days > 0).sort((a, b) => b.adherence_pct - a.adherence_pct)[0];
  const proteinHit = stats.avg_protein && protTarget ? Math.round((stats.avg_protein / protTarget) * 100) : 0;
  const calDiff = stats.avg_calories && target ? stats.avg_calories - target : null;
  const signed = (n) => `${n > 0 ? '+' : ''}${formatNumber(n)}`;

  const tips = [
    stats.avg_calories > target + 200 && t('macroInsights.tipOver', { kcal: stats.avg_calories - target }),
    stats.avg_calories > 0 && stats.avg_calories < target - 200 && t('macroInsights.tipUnder', { kcal: target - stats.avg_calories }),
    stats.avg_protein > 0 && proteinHit < 80 && t('macroInsights.tipProtein', { pct: proteinHit }),
    stats.streak >= 7 && t('macroInsights.tipStreak', { streak: stats.streak }),
    stats.total_completed < 7 && t('macroInsights.tipLogMore'),
    t('macroInsights.tipReassess'),
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader title={t('macroInsights.heading')} subtitle={t('macroInsights.subtitle')} />
      <WeeklyInsightsCard className="" />

      <Ledger items={[
        { label: t('macroInsights.avgCalories'), value: formatNumber(stats.avg_calories || 0), suffix: calDiff != null ? `kcal · ${signed(calDiff)}` : 'kcal' },
        { label: t('macroInsights.avgProtein'), value: stats.avg_protein || 0, suffix: protTarget ? `g · ${t('macroInsights.ofTarget', { pct: proteinHit })}` : 'g' },
        { label: t('macroInsights.adherence'), value: bestWeek?.adherence_pct ?? 0, suffix: bestWeek ? `% · ${t('macroInsights.bestWeek', { num: bestWeek.week_number })}` : '%' },
      ]} />

      <Panel title={t('macroInsights.weeklyBreakdown')} bodyClassName="pt-3">
        {weeks.length === 0 ? (
          <p className="px-6 pb-5 text-sm text-ink-500">{t('macroInsights.logSomeFirst')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="text-xs text-ink-500 border-b border-ink-200">
                  <th className="px-5 sm:px-6 py-2.5 text-start font-medium">{t('macroInsights.weekCol')}</th>
                  <th className="px-3 py-2.5 text-end font-medium">{t('macroInsights.daysCol')}</th>
                  <th className="px-3 py-2.5 text-end font-medium">{t('macroInsights.adherenceLabel')}</th>
                  <th className="px-3 py-2.5 text-end font-medium">{t('macroInsights.avgKcal')}</th>
                  <th className="px-5 sm:px-6 py-2.5 text-end font-medium">{t('macroInsights.vsTarget')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {weeks.map((w) => (
                  <tr key={w.week_number}>
                    <td className="px-5 sm:px-6 py-3 font-semibold text-ink-900">{t('macroInsights.weekN', { num: w.week_number })}</td>
                    <td className="px-3 py-3 text-end text-ink-700">{w.completed_days}/7</td>
                    <td className="px-3 py-3 text-end text-ink-900 font-semibold">{w.adherence_pct}%</td>
                    <td className="px-3 py-3 text-end text-ink-700">{w.avg_calories ? formatNumber(w.avg_calories) : '—'}</td>
                    <td className={`px-5 sm:px-6 py-3 text-end ${w.cal_diff > 150 ? 'text-saffron-700' : 'text-ink-700'}`}>{w.cal_diff != null ? signed(w.cal_diff) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title={t('macroInsights.tips')}>
        <ul className="space-y-2.5 -mt-1">
          {tips.map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink-700">
              <span aria-hidden="true" className="mt-2.5 w-3 h-px bg-ink-400 shrink-0" />{tip}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
