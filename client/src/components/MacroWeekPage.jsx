import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';

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

  if (loading) return <div className="text-gray-500">{t('macroWeek.loading')}</div>;
  if (!week) return <div className="text-gray-500">{t('macroWeek.noData')}</div>;

  const calTarget = config?.calorie_target || 0;

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">{t('macroWeek.heading', { num: weekNum })}</h1>
        <p className="text-gray-500">{t('macroWeek.subtitle')}</p>
      </div>

      <div className="space-y-3">
        {week.days.map(d => {
          const log = d.log;
          const dateObj = new Date(d.date + 'T12:00:00');
          const dow = t(`macroWeek.dow.${dateObj.getUTCDay()}`);
          const day = dateObj.getUTCDate();
          const month = formatDate(d.date + 'T12:00:00', { month: 'short' });
          const isToday = d.day_index === todayIndex;
          const isFuture = d.day_index > todayIndex;
          const kcal = log?.calories_consumed || 0;
          const calPct = calTarget ? Math.min(100, (kcal / calTarget) * 100) : 0;
          const calColor = !calTarget ? 'bg-gray-300'
            : kcal === 0 ? 'bg-gray-200'
            : Math.abs(kcal - calTarget) <= calTarget * 0.1 ? 'bg-emerald-500'
            : kcal > calTarget ? 'bg-red-400'
            : 'bg-amber-400';

          return (
            <button
              key={d.day_index}
              onClick={() => !isFuture && onSelectDay(d.day_index)}
              disabled={isFuture}
              className={`w-full text-start bg-white rounded-2xl border-2 p-4 transition-all ${isFuture ? 'opacity-50 cursor-not-allowed border-gray-100' : 'border-gray-100 hover:border-indigo-300 hover:shadow-md'} ${isToday ? 'ring-2 ring-yellow-400' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="text-center shrink-0">
                  <div className="text-xs font-bold text-gray-500 uppercase">{dow}</div>
                  <div className="text-2xl font-extrabold text-gray-800">{day}</div>
                  <div className="text-[10px] text-gray-400 uppercase">{month}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">{t('macroWeek.dayN', { num: d.day_index + 1 })}</span>
                    {isToday && <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold">{t('macroWeek.todayBadge')}</span>}
                    {isFuture && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">{t('macroWeek.upcomingBadge')}</span>}
                  </div>
                  {log ? (
                    <>
                      <div className="text-xs text-gray-500 mb-1">
                        {t('macroWeek.kcalLine', {
                          kcal: Math.round(kcal),
                          target: calTarget || '—',
                          p: Math.round(log.protein_g),
                          c: Math.round(log.carbs_g),
                          f: Math.round(log.fat_g),
                        })}
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${calColor}`} style={{ width: `${calPct}%` }} />
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-400">{isFuture ? t('macroWeek.notYet') : t('macroWeek.noLog')}</div>
                  )}
                </div>
                {log?.workout_done && <span className="text-2xl">💪</span>}
                {log?.score === 5 && <span className="text-2xl">⭐</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
