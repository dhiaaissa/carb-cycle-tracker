import { useEffect, useState } from 'react';
import { Barbell, Star } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { formatDate, formatNumber } from '../lib/format';
import { PageHeader, Panel } from './ui/primitives';

export default function MacroWeekPage({ weekNum, todayIndex, config, onSelectDay }) {
  const { t } = useTranslation();
  const [week, setWeek] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getMacroWeek(weekNum).then(w => {
      if (!cancelled) { setWeek(w); setLoading(false); }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [weekNum]);

  if (loading) return <p className="text-sm text-ink-500" role="status">{t('macroWeek.loading')}</p>;
  if (!week) return <p className="text-sm text-ink-500">{t('macroWeek.noData')}</p>;

  const calTarget = config?.day_targets?.flat?.calories || 0;

  return (
    <div>
      <PageHeader title={t('macroWeek.heading', { num: weekNum })} subtitle={t('macroWeek.subtitle')} />

      <Panel bodyClassName="">
        <ol className="divide-y divide-ink-200">
          {week.days.map((d) => {
            const log = d.log;
            const isToday = d.day_index === todayIndex;
            const isFuture = d.day_index > todayIndex;
            const kcal = log?.calories_consumed || 0;
            const pct = calTarget ? (kcal / calTarget) * 100 : 0;
            return (
              <li key={d.day_index}>
                <button
                  type="button"
                  onClick={() => !isFuture && onSelectDay(d.day_index)}
                  disabled={isFuture}
                  className={`w-full text-start flex items-center gap-4 px-5 py-3.5 hover:bg-ink-50 disabled:hover:bg-transparent ${isToday ? 'bg-door-50' : ''} ${isFuture ? 'opacity-60' : ''}`}
                >
                  <div className="w-24 shrink-0">
                    <div className="text-sm font-semibold text-ink-900">{formatDate(d.date + 'T12:00:00', { weekday: 'long' })}</div>
                    <div className="text-xs text-ink-500">{formatDate(d.date + 'T12:00:00', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    {log ? (
                      <>
                        <div className="flex flex-wrap justify-between gap-x-3 text-xs text-ink-600 tabular-nums mb-1.5">
                          <span><span className="font-semibold text-ink-900">{formatNumber(Math.round(kcal))}</span> / {calTarget ? formatNumber(calTarget) : '—'} kcal</span>
                          <span>{t('macroWeek.macroShort', { p: Math.round(log.protein_g), c: Math.round(log.carbs_g), f: Math.round(log.fat_g) })}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-ink-100">
                          <div className={`h-1.5 rounded-full ${pct > 110 ? 'bg-saffron-500' : 'bg-door-600'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-ink-500">{isFuture ? t('macroWeek.notYet') : t('macroWeek.noLog')}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-14 justify-end">
                    {isToday && <span className="text-xs font-semibold text-door-700">{t('macroWeek.todayBadge')}</span>}
                    {log?.workout_done && <Barbell size={18} weight="bold" className="text-door-600" aria-label={t('day.workoutDone')} />}
                    {log?.score === 5 && <Star size={18} weight="fill" className="text-saffron-500" aria-label={t('day.perfect')} />}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </Panel>
    </div>
  );
}
