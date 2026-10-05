import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartBar } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { FOODS } from '../lib/foods';
import { formatNumber } from '../lib/format';
import { PageHeader, Panel, Ledger, EmptyState, TextButton } from './ui/primitives';
import WeeklyInsightsCard from './WeeklyInsightsCard';

/**
 * Adherence is a polarity around 100% of target, so it uses a diverging scale:
 * cool (under) ↔ neutral (on target) ↔ warm (over). Validated for CVD with the
 * dataviz validator in both themes. Never red: over target isn't a failure.
 */
const BAND = {
  under: { bar: 'bg-door-500', key: 'insights.legendUnder' },
  on:    { bar: 'bg-ink-400',  key: 'insights.legendOnTarget' },
  over:  { bar: 'bg-saffron-500', key: 'insights.legendOver' },
};
const band = (pct) => (pct < 85 ? 'under' : pct > 115 ? 'over' : 'on');

// Macro identity colours (validated: protein / carbs / fat, adjacent in the split bar).
const MACRO = [
  { key: 'protein', field: 'protein_g', fill: 'bg-door-600', pctKey: 'insights.proteinPct' },
  { key: 'carbs',   field: 'carbs_g',   fill: 'bg-saffron-500', pctKey: 'insights.carbsPct' },
  { key: 'fat',     field: 'fat_g',     fill: 'bg-olive-600', pctKey: 'insights.fatPct' },
];

export default function InsightsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [asTable, setAsTable] = useState(false);

  useEffect(() => {
    api.getInsights().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center py-12 text-sm text-ink-500" role="status">{t('insights.loading')}</p>;
  if (!data || data.total_days_logged === 0) {
    return <EmptyState icon={ChartBar} title={t('insights.noDataTitle')} text={t('insights.noDataSub')} />;
  }

  const { calorie_adherence, macro_averages, top_foods, best_day, worst_day, weekly_adherence } = data;
  const avgAdherence = calorie_adherence.length
    ? Math.round(calorie_adherence.reduce((s, d) => s + d.pct, 0) / calorie_adherence.length)
    : 0;

  const kcalFrom = { protein: macro_averages.protein_g * 4, carbs: macro_averages.carbs_g * 4, fat: macro_averages.fat_g * 9 };
  const totalKcal = kcalFrom.protein + kcalFrom.carbs + kcalFrom.fat;
  const pct = (k) => (totalKcal ? Math.round((kcalFrom[k] / totalKcal) * 100) : 0);
  const split = { protein: pct('protein'), carbs: pct('carbs') };
  split.fat = Math.max(0, 100 - split.protein - split.carbs);

  const maxPct = Math.max(130, ...calorie_adherence.map((d) => d.pct));

  return (
    <div className="space-y-6">
      <PageHeader title={t('insights.heading')} eyebrow={t('insights.daysLogged', { count: data.total_days_logged })} />
      <WeeklyInsightsCard className="" />

      <Ledger items={[
        { label: t('insights.avgAdherence'), value: avgAdherence, suffix: '%' },
        { label: t('insights.avgProtein'), value: macro_averages.protein_g, suffix: 'g' },
        { label: t('insights.avgCarbs'), value: macro_averages.carbs_g, suffix: 'g' },
        { label: t('insights.avgFat'), value: macro_averages.fat_g, suffix: 'g' },
      ]} />

      {calorie_adherence.length > 1 && (
        <Panel
          title={t('insights.dailyAdherence')}
          action={<TextButton onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>{asTable ? t('insights.showChart') : t('insights.showTable')}</TextButton>}
        >
          {asTable ? (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm tabular-nums">
                <thead><tr className="text-xs text-ink-500 border-b border-ink-200">
                  <th className="py-2 px-1 text-start font-medium">{t('weekPage.col.day')}</th>
                  <th className="py-2 px-1 text-end font-medium">{t('weekPage.col.calories')}</th>
                  <th className="py-2 px-1 text-end font-medium">%</th>
                </tr></thead>
                <tbody className="divide-y divide-ink-200">
                  {calorie_adherence.map((d) => (
                    <tr key={d.day_index}>
                      <td className="py-2 px-1 text-ink-900">{t('modal.dayNum', { num: d.day_index + 1 })}</td>
                      <td className="py-2 px-1 text-end text-ink-700">{formatNumber(d.consumed)} / {formatNumber(d.target)}</td>
                      <td className="py-2 px-1 text-end font-semibold text-ink-900">{d.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <div className="relative h-40" role="img" aria-label={t('insights.chartAria', { avg: avgAdherence, days: calorie_adherence.length })}>
                {/* 100% reference line */}
                <div className="absolute inset-x-0 border-t border-dashed border-ink-400" style={{ bottom: `${(100 / maxPct) * 100}%` }} aria-hidden="true">
                  <span className="absolute -top-4 end-0 text-[10px] text-ink-500 bg-white px-1">100%</span>
                </div>
                <div className="absolute inset-0 flex items-end gap-[2px]">
                  {calorie_adherence.map((d) => (
                    <div key={d.day_index} className="group relative flex-1 h-full flex items-end">
                      <div className={`w-full rounded-t-[3px] min-h-[2px] ${BAND[band(d.pct)].bar}`} style={{ height: `${(Math.min(d.pct, maxPct) / maxPct) * 100}%` }} />
                      <div className="pointer-events-none absolute bottom-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap rounded-md border border-ink-200 bg-white px-2 py-1 text-[11px] text-ink-900 shadow-[0_4px_12px_rgb(0_0_0/0.1)] z-10">
                        {t('modal.dayNum', { num: d.day_index + 1 })} · <span className="font-semibold">{d.pct}%</span> · {formatNumber(d.consumed)} kcal
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-ink-500 mt-2 tabular-nums">
                <span>{t('modal.dayNum', { num: calorie_adherence[0].day_index + 1 })}</span>
                <span>{t('modal.dayNum', { num: calorie_adherence[calorie_adherence.length - 1].day_index + 1 })}</span>
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-ink-600" aria-label={t('log.legend')}>
                {Object.values(BAND).map((b) => (
                  <li key={b.key} className="flex items-center gap-1.5"><span aria-hidden="true" className={`w-2.5 h-2.5 rounded-[2px] ${b.bar}`} />{t(b.key)}</li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title={t('insights.avgMacroSplit')}>
          <div className="flex h-3 gap-[2px] rounded-[3px] overflow-hidden" role="img"
            aria-label={MACRO.map((m) => `${t(`macro.${m.key}`)} ${split[m.key]}%`).join(', ')}>
            {MACRO.map((m) => <div key={m.key} className={m.fill} style={{ width: `${split[m.key]}%` }} />)}
          </div>
          <ul className="grid grid-cols-3 gap-3 mt-3">
            {MACRO.map((m) => (
              <li key={m.key}>
                <div className="flex items-center gap-1.5 text-xs text-ink-600"><span aria-hidden="true" className={`w-2.5 h-2.5 rounded-[2px] ${m.fill}`} />{t(`macro.${m.key}`)}</div>
                <div className="font-display text-xl font-semibold text-ink-900 tabular-nums mt-0.5">{split[m.key]}%</div>
                <div className="text-xs text-ink-500 tabular-nums">{macro_averages[m.field]}g {t('insights.perDay')}</div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-500 mt-3">{t('insights.splitByCalories')}</p>
        </Panel>

        {weekly_adherence.length > 0 && (
          <Panel title={t('insights.weeklyAdherence')}>
            <ol className="space-y-2.5">
              {weekly_adherence.map((w) => (
                <li key={w.week} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-ink-600">{t('insights.weekN', { num: w.week })}</span>
                  <div className="flex-1 h-2 rounded-full bg-ink-100">
                    <div className={`h-2 rounded-full ${BAND[band(w.avg_adherence_pct)].bar}`} style={{ width: `${Math.min(100, w.avg_adherence_pct)}%` }} />
                  </div>
                  <span className="w-12 text-end font-semibold text-ink-900 tabular-nums">{w.avg_adherence_pct}%</span>
                  <span className="w-20 text-end text-xs text-ink-500 tabular-nums">{t('insights.scoreLabel', { score: w.avg_score })}</span>
                </li>
              ))}
            </ol>
          </Panel>
        )}
      </div>

      {top_foods.length > 0 && (
        <Panel title={t('insights.mostEaten')} bodyClassName="px-5 sm:px-6 pb-4 pt-2">
          <ol className="divide-y divide-ink-200">
            {top_foods.map((tf, i) => {
              const food = FOODS[tf.food_id];
              if (!food) return null;
              return (
                <li key={tf.food_id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-5 text-ink-400 tabular-nums">{i + 1}</span>
                  <span aria-hidden="true">{food.emoji}</span>
                  <span className="flex-1 min-w-0 truncate text-ink-900">{food.name.split('(')[0].trim()}</span>
                  <div className="w-24 sm:w-40 h-1.5 rounded-full bg-ink-100" aria-hidden="true">
                    <div className="h-1.5 rounded-full bg-door-600" style={{ width: `${(tf.count / top_foods[0].count) * 100}%` }} />
                  </div>
                  <span className="w-16 text-end text-ink-600 tabular-nums">{t('insights.timesEaten', { count: tf.count })}</span>
                </li>
              );
            })}
          </ol>
        </Panel>
      )}

      {(best_day || worst_day) && (
        <div className="grid grid-cols-2 gap-4">
          {[
            [best_day, 'insights.bestDay'],
            [worst_day, 'insights.needsWork'],
          ].filter(([d]) => d).map(([d, key]) => (
            <Panel key={key}>
              <div className="text-xs text-ink-500">{t(key)}</div>
              <div className="font-display text-xl font-semibold text-ink-900 mt-0.5">{t('modal.dayNum', { num: d.day_index + 1 })}</div>
              <div className="text-xs text-ink-500 mt-0.5 tabular-nums">{t('insights.dayScoreAndKcal', { score: d.score, kcal: d.calories })}</div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
