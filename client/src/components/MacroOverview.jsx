import { useTranslation } from 'react-i18next';
import WeightChart from './WeightChart';
import WeeklyInsightsCard from './WeeklyInsightsCard';
import AdaptiveTdeeCard from './AdaptiveTdeeCard';
import { formatDate, formatNumber } from '../lib/format';
import { PageHeader, Panel, Ledger } from './ui/primitives';

const PROGRAMME_NAME_KEY = {
  weight_loss: 'macroOverview.programmeWeightLoss',
  muscle_gain: 'macroOverview.programmeMuscle',
  recomp: 'macroOverview.programmeRecomp',
};

const MACROS = [
  ['protein_g', 'macroOverview.protein', 'bg-door-600'],
  ['carbs_g', 'macroOverview.carbs', 'bg-saffron-500'],
  ['fat_g', 'macroOverview.fat', 'bg-olive-600'],
];

export default function MacroOverview({ stats, config, onSelectView }) {
  const { t } = useTranslation();
  if (!stats) return <p className="text-center text-sm text-ink-500 py-10" role="status">{t('macroOverview.loading')}</p>;

  const target = config?.day_targets?.flat;
  const delta = target?.calories && config?.tdee ? target.calories - Math.round(config.tdee) : null;
  const fmt = (d) => (d ? formatDate(d + 'T12:00:00', { day: 'numeric', month: 'short' }) : '');

  return (
    <div>
      <PageHeader
        eyebrow={t(PROGRAMME_NAME_KEY[config?.programme] || 'macroOverview.programmeRecomp')}
        title={t('macroOverview.title')}
      />

      <Ledger className="mb-6" items={[
        { label: t('macroStats.streak'), value: stats.streak, suffix: t('macroOverview.daysUnit') },
        { label: t('macroStats.logged'), value: stats.total_completed },
        { label: t('macroStats.perfectDays'), value: stats.total_perfect },
        { label: t('macroStats.avgCalories'), value: stats.avg_calories ? formatNumber(stats.avg_calories) : '—', suffix: stats.avg_calories ? 'kcal' : '' },
      ]} />

      <WeeklyInsightsCard />
      <AdaptiveTdeeCard />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title={t('macroOverview.dailyTargets')}>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-semibold text-ink-900 tabular-nums">{target?.calories ? formatNumber(target.calories) : '—'}</span>
            <span className="text-sm text-ink-500">{t('macroOverview.kcal')}</span>
          </div>
          <dl className="grid grid-cols-3 gap-3 mt-4">
            {MACROS.map(([k, label, fill]) => (
              <div key={k}>
                <dt className="flex items-center gap-1.5 text-xs text-ink-500"><span aria-hidden="true" className={`w-2 h-2 rounded-[2px] ${fill}`} />{t(label)}</dt>
                <dd className="font-display text-xl font-semibold text-ink-900 tabular-nums mt-0.5">{target?.[k] ?? '—'}<span className="text-sm font-sans font-normal text-ink-500 ms-0.5">g</span></dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-ink-500 mt-4 pt-3 border-t border-ink-200 tabular-nums">
            {t('macroOverview.targetMath', {
              bmr: config?.bmr ? formatNumber(config.bmr) : '—',
              tdee: config?.tdee ? formatNumber(config.tdee) : '—',
              delta: delta == null ? '—' : `${delta > 0 ? '+' : ''}${formatNumber(delta)}`,
            })}
          </p>
        </Panel>

        <Panel title={t('macroOverview.weightProgress')}>
          <dl className="grid grid-cols-3 gap-3">
            {[
              ['macroOverview.start', stats.start_weight],
              ['macroOverview.now', stats.latest_weight],
              ['macroOverview.goal', stats.goal_weight],
            ].map(([label, v]) => (
              <div key={label}>
                <dt className="text-xs text-ink-500">{t(label)}</dt>
                <dd className="font-display text-xl font-semibold text-ink-900 tabular-nums mt-0.5">{v ?? '—'}{v != null && <span className="text-sm font-sans font-normal text-ink-500 ms-0.5">kg</span>}</dd>
              </div>
            ))}
          </dl>
          {stats.weight_change != null && (
            <p className="text-sm mt-4 pt-3 border-t border-ink-200 text-ink-700 tabular-nums">
              {t('macroOverview.changeSoFar', { change: `${stats.weight_change > 0 ? '+' : ''}${stats.weight_change}` })}
            </p>
          )}
        </Panel>
      </div>

      <WeightChart weightEntries={stats.weight_entries} />

      {(stats.weekly_summary || []).length > 0 && (
        <Panel title={t('macroOverview.weeks')} bodyClassName="px-5 sm:px-6 pb-3 pt-2">
          <ol className="divide-y divide-ink-200">
            {stats.weekly_summary.map((ws) => (
              <li key={ws.week_number}>
                <button type="button" onClick={() => onSelectView(`week-${ws.week_number}`)}
                  className="w-full flex items-center gap-4 py-3 text-start hover:bg-ink-50 -mx-2 px-2 rounded-md">
                  <span className="w-20 shrink-0 text-sm font-semibold text-ink-900">
                    {t('nav.weekNum', { num: ws.week_number })}
                    {ws.week_number === stats.current_week && <span className="block text-[11px] font-semibold text-door-700">{t('nav.now')}</span>}
                  </span>
                  <span className="hidden sm:block w-28 shrink-0 text-xs text-ink-500 tabular-nums">{fmt(ws.start_date)} – {fmt(ws.end_date)}</span>
                  <span className="flex-1 flex gap-1" aria-label={t('macroOverview.daysOf7', { done: ws.completed_days })}>
                    {Array.from({ length: 7 }, (_, i) => (
                      <span key={i} className={`h-2 flex-1 max-w-6 rounded-[2px] border ${i < ws.completed_days ? 'bg-door-500 border-door-500' : 'border-ink-300'}`} />
                    ))}
                  </span>
                  <span className="w-24 shrink-0 text-end text-sm text-ink-600 tabular-nums">
                    {ws.avg_calories ? t('macroOverview.avgKcal', { kcal: formatNumber(ws.avg_calories) }) : t('macroOverview.noLogsYet')}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}
