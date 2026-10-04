import { useTranslation } from 'react-i18next';
import ProgressRing from './ui/ProgressRing';
import { formatNumber } from '../lib/format';
import { MEAL_KEYS, MEAL_ICON_COMPONENTS, MEAL_NUM, computeMealTotals } from '../lib/mealTotals';

const MACROS = [
  { key: 'protein', targetKey: 'protein_g', color: 'text-door-600', labelKey: 'macro.protein' },
  { key: 'carbs',   targetKey: 'carbs_g',   color: 'text-saffron-500',  labelKey: 'macro.carbs' },
  { key: 'fat',     targetKey: 'fat_g',     color: 'text-olive-600',   labelKey: 'macro.fat' },
];

/**
 * "What's left today?" at a glance: calories remaining, macro rings, and the
 * day's meals as one-tap entry points.
 *
 * @param {object}   props.meals      { meal1: [{ food_id, amount }], ... }
 * @param {object}   props.target     { calories, protein_g, carbs_g, fat_g }
 * @param {object}   props.foodDb     built-in + custom foods
 * @param {number}   [props.extraKcal] kcal not tied to meal items (e.g. quick-add cheat kcal)
 * @param {Function} props.onOpenMeal (mealKey) => void
 * @param {ReactNode} [props.badge]   e.g. the carb-cycle day type chip
 * @param {boolean}  [props.showMeals] hide the meal tiles when the page lists meals itself
 */
export default function TodaySummary({ meals = {}, target, foodDb, extraKcal = 0, onOpenMeal, badge, title, showMeals = true }) {
  const { t } = useTranslation();

  const perMeal = Object.fromEntries(MEAL_KEYS.map((k) => [k, computeMealTotals(meals[k], foodDb)]));
  const totals = MEAL_KEYS.reduce((a, k) => ({
    kcal: a.kcal + perMeal[k].kcal,
    protein: a.protein + perMeal[k].protein,
    carbs: a.carbs + perMeal[k].carbs,
    fat: a.fat + perMeal[k].fat,
  }), { kcal: extraKcal, protein: 0, carbs: 0, fat: 0 });

  const eaten = Math.round(totals.kcal);
  const goal = Math.round(target.calories);
  const left = goal - eaten;
  const over = left < 0;

  return (
    <section aria-labelledby="today-title" className="bg-white rounded-3xl border border-ink-200 shadow-sm p-5 sm:p-6 mb-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 id="today-title" className="font-display text-lg font-semibold text-ink-900">{title ?? t('today.title')}</h2>
        {badge}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        {/* Calories remaining */}
        <div className="flex flex-col items-center">
          <ProgressRing
            value={eaten} max={goal} size={176} stroke={14} colorClass="text-door-600"
            label={t('today.ringLabel', { eaten: formatNumber(eaten), goal: formatNumber(goal) })}
          >
            <span className={`font-display text-[40px] leading-none font-semibold tabular-nums ${over ? 'text-saffron-700' : 'text-ink-900'}`}>
              {formatNumber(Math.abs(left))}
            </span>
            <span className="text-xs font-semibold text-ink-500 mt-0.5">
              {over ? t('today.kcalAbove') : t('today.kcalLeft')}
            </span>
          </ProgressRing>
          <p className="text-sm text-ink-500 mt-3 tabular-nums">
            {t('today.eatenOfGoal', { eaten: formatNumber(eaten), goal: formatNumber(goal) })}
          </p>
          {over && <p className="text-xs text-saffron-700 mt-1 max-w-[16rem] text-center">{t('today.overNote')}</p>}
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5 w-full sm:w-auto sm:flex-1 justify-items-center">
          {MACROS.map((m) => {
            const have = Math.round(totals[m.key]);
            const need = Math.round(target[m.targetKey] || 0);
            const mLeft = need - have;
            return (
              <div key={m.key} className="flex flex-col items-center text-center">
                <ProgressRing
                  value={have} max={need} size={84} stroke={8} colorClass={m.color}
                  label={t('today.macroRingLabel', { macro: t(m.labelKey), have, need })}
                >
                  <span className="text-base font-bold text-ink-800 tabular-nums">{Math.abs(mLeft)}g</span>
                  <span className="text-[10px] font-semibold text-ink-500">{mLeft < 0 ? t('today.above') : t('today.left')}</span>
                </ProgressRing>
                <span className="text-xs font-bold text-ink-700 mt-2">{t(m.labelKey)}</span>
                <span className="text-[11px] text-ink-500 tabular-nums">{have} / {need}g</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Meals at a glance */}
      {showMeals && <ul className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MEAL_KEYS.map((k) => {
          const items = meals[k] || [];
          const kcal = Math.round(perMeal[k].kcal);
          const name = t(`meal.${MEAL_NUM[k]}`);
          const Icon = MEAL_ICON_COMPONENTS[k];
          return (
            <li key={k}>
              <button
                type="button"
                onClick={() => onOpenMeal?.(k)}
                aria-label={items.length ? t('today.mealLogged', { meal: name, kcal }) : t('today.mealAdd', { meal: name })}
                className={`w-full text-start rounded-2xl px-3 py-2.5 border transition-colors ${
                  items.length ? 'bg-ink-50 border-ink-200 hover:border-door-300' : 'bg-white border-dashed border-ink-300 hover:border-door-400 hover:bg-door-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={18} aria-hidden="true" className="text-ink-500" />
                  <span className="font-semibold text-sm text-ink-800 truncate">{name}</span>
                </div>
                <div className="text-xs mt-0.5 tabular-nums">
                  {items.length
                    ? <span className="text-ink-500">{t('today.mealSummary', { count: items.length, kcal: formatNumber(kcal) })}</span>
                    : <span className="text-door-600 font-semibold">+ {t('today.add')}</span>}
                </div>
              </button>
            </li>
          );
        })}
      </ul>}
    </section>
  );
}
