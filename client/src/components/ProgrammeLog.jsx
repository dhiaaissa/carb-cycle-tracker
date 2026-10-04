import { useTranslation } from 'react-i18next';
import { formatDate, formatNumber } from '../lib/format';
import { WATER_GOALS } from '../lib/calories';

// Logged = solid; planned = tint; the day type is readable either way.
const CELL = {
  low:  { done: 'bg-door-500 text-white',      plan: 'bg-door-50 text-door-700' },
  med:  { done: 'bg-saffron-400 text-ink-900', plan: 'bg-saffron-50 text-saffron-800' },
  high: { done: 'bg-olive-600 text-white',     plan: 'bg-olive-50 text-olive-800' },
};

/**
 * The 56-day programme as a logbook page: one row per week, one cell per day.
 * Replaces the stat-card row, the phase progress cards and the week grid.
 */
export default function ProgrammeLog({ schedule, days, stats, todayIndex, onSelectDay, onSelectWeek }) {
  const { t } = useTranslation();
  if (!schedule?.length) return null;

  const logged = Object.keys(days).filter((k) => Number(k) >= 0 && Number(k) <= 55).length;
  const today = days[todayIndex];
  const todayType = schedule[todayIndex]?.day_type;
  const weeks = Array.from({ length: 8 }, (_, w) => schedule.slice(w * 7, w * 7 + 7));

  return (
    <section aria-labelledby="log-title" className="bg-white rounded-xl border border-ink-200 p-5 sm:p-6 mb-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 mb-4">
        <h2 id="log-title" className="font-display text-lg font-semibold text-ink-900">{t('log.title')}</h2>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Stat label={t('log.streak')} value={t('stats.streakDays', { count: stats?.streak ?? 0 })} />
          <Stat label={t('log.logged')} value={t('log.loggedOf', { done: logged, total: 56 })} />
          {todayType && (
            <Stat label={t('log.water')} value={`${formatNumber(today?.water_liters ?? 0)} / ${WATER_GOALS[todayType]} L`} />
          )}
        </dl>
      </div>

      <ol className="space-y-1.5">
        {weeks.map((week, w) => (
          <li key={w} className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onSelectWeek(w + 1)}
              className="w-12 sm:w-16 shrink-0 text-start text-xs font-medium text-ink-600 hover:text-door-700 py-1"
            >
              {t('log.weekShort', { num: w + 1 })}
            </button>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 flex-1">
              {week.map((d) => {
                const isLogged = !!days[d.day_index];
                const isToday = d.day_index === todayIndex;
                const isFuture = d.day_index > todayIndex;
                const label = t('log.cellAria', {
                  date: formatDate(d.date + 'T12:00:00', { weekday: 'long', day: 'numeric', month: 'long' }),
                  type: t(`dayType.${d.day_type}`),
                  state: isLogged ? t('log.stateLogged') : isFuture ? t('log.statePlanned') : t('log.stateOpen'),
                });
                return (
                  <button
                    key={d.day_index}
                    type="button"
                    onClick={() => onSelectDay(d.day_index)}
                    disabled={isFuture}
                    aria-label={label}
                    title={label}
                    className={`h-8 sm:h-9 rounded-[4px] text-[11px] font-medium tabular-nums flex items-center justify-center
                      ${CELL[d.day_type][isLogged ? 'done' : 'plan']}
                      ${isToday ? 'ring-2 ring-ink-900 ring-offset-1 ring-offset-white' : ''}
                      ${isFuture ? 'opacity-60 cursor-default' : 'hover:brightness-95'}`}
                  >
                    {Number(d.date.slice(8))}
                  </button>
                );
              })}
            </div>
            <span className="hidden sm:block w-20 shrink-0 text-xs text-ink-500 text-end">
              {w % 2 === 0 ? t(`phase.${week[0]?.phase}`) : ''}
            </span>
          </li>
        ))}
      </ol>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-ink-600" aria-label={t('log.legend')}>
        {['low', 'med', 'high'].map((type) => (
          <li key={type} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`w-3 h-3 rounded-[2px] ${CELL[type].done.split(' ')[0]}`} />
            {t(`dayType.${type}`)}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-3 h-3 rounded-[2px] bg-ink-100 border border-ink-200" />
          {t('log.legendTint')}
        </li>
      </ul>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-semibold text-ink-900 tabular-nums">{value}</dd>
    </div>
  );
}
