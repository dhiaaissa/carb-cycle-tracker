import { scoreLabel } from '../lib/calories';
import { FOODS } from '../lib/foods';

const TYPE_CONFIG = {
  low:  { bg: 'bg-gradient-to-br from-red-50 to-red-100',    border: 'border-l-red-500',    badge: 'bg-red-100 text-red-700',    emoji: '🔴' },
  med:  { bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100', border: 'border-l-yellow-500', badge: 'bg-yellow-100 text-yellow-700', emoji: '🟡' },
  high: { bg: 'bg-gradient-to-br from-green-50 to-green-100',  border: 'border-l-green-500',  badge: 'bg-green-100 text-green-700',  emoji: '🟢' },
};

export default function DayCard({ scheduleDay, dayLog, isToday, onClick }) {
  const { day_index, date, day_type } = scheduleDay;
  const config = TYPE_CONFIG[day_type];
  const isFuture = new Date(date + 'T12:00:00') > new Date();

  const score    = dayLog?.score ?? 0;
  const water    = dayLog?.water_liters ?? 0;
  const weight   = dayLog?.weight_kg;
  const workout  = dayLog?.workout_done;
  const meals    = dayLog?.meals_json || {};
  const mealsDone = [meals.meal1, meals.meal2, meals.meal3, meals.meal4].map(m => (m?.length ?? 0) > 0);

  // Collect unique food emojis eaten today for a visual preview
  const foodEmojis = [...new Set(
    Object.values(meals).flat().map(item => FOODS[item?.food_id]?.emoji).filter(Boolean)
  )].slice(0, 5);

  const formatted = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  return (
    <button
      onClick={onClick}
      className={`w-full text-left ${config.bg} rounded-xl border-2 border-l-4 ${config.border} border-gray-100 p-3
        hover:shadow-lg hover:scale-105 transition-all duration-200
        ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2 shadow-lg scale-105' : ''}
        ${isFuture ? 'opacity-50' : ''}`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold text-gray-800">D{day_index + 1}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${config.badge}`}>
          {config.emoji}
        </span>
      </div>

      <div className="text-xs text-gray-500 mb-2 truncate">{formatted}</div>

      {/* Food emojis or meal dots */}
      {foodEmojis.length > 0 ? (
        <div className="text-base mb-2 leading-none">{foodEmojis.join('')}</div>
      ) : (
        <div className="flex gap-1 mb-2">
          {mealsDone.map((done, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full ${done ? 'bg-green-500' : 'bg-gray-300'}`} />
          ))}
        </div>
      )}

      {/* Bottom badges */}
      <div className="flex flex-wrap gap-1 text-xs">
        {score > 0 && (
          <span className={`px-1.5 py-0.5 rounded font-bold ${score === 5 ? 'bg-green-200 text-green-800' : score >= 3 ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>
            {score}⭐
          </span>
        )}
        {workout && <span className="text-purple-600">💪</span>}
        {water > 0 && <span className="text-cyan-600">💧{water}L</span>}
        {weight && <span className="text-orange-600">⚖{weight}</span>}
      </div>
    </button>
  );
}
