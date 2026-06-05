import { useState } from 'react';
import { FOODS, getNutrition } from '../lib/foods';

/**
 * AI Meal Suggester — finds food combos to match remaining macros.
 * Uses a greedy algorithm: picks best food for dominant remaining macro, adjusts amount.
 */

// Foods worth suggesting (skip cola zero, cucumber is low value)
const SUGGEST_FOODS = Object.values(FOODS).filter(f => f.id !== 'coca_cola_zero');

function getMacrosPerUnit(food) {
  if (food.unit === 'g') {
    return {
      kcal: food.kcal_per_100g / 100,
      protein: food.protein_per_100g / 100,
      carbs: food.carbs_per_100g / 100,
      fat: food.fat_per_100g / 100,
    };
  }
  return {
    kcal: food.kcal_per_unit,
    protein: food.protein_per_unit,
    carbs: food.carbs_per_unit,
    fat: food.fat_per_unit,
  };
}

function suggestMeal(remainingProtein, remainingCarbs, remainingFat, maxKcal) {
  const suggestions = [];
  let pLeft = Math.max(0, remainingProtein);
  let cLeft = Math.max(0, remainingCarbs);
  let fLeft = Math.max(0, remainingFat);
  let kcalLeft = Math.max(0, maxKcal);

  const usedFoods = new Set();

  // Shuffle the food list so each call produces different combos
  const shuffled = [...SUGGEST_FOODS].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 4 && kcalLeft > 50; i++) {
    // Determine dominant macro needed
    const total = pLeft + cLeft + fLeft;
    if (total < 5) break;

    // Collect all viable candidates with scores
    const candidates = [];

    for (const food of shuffled) {
      if (usedFoods.has(food.id)) continue;
      const m = getMacrosPerUnit(food);
      if (m.kcal === 0) continue;

      // Score: how well this food fills the dominant need without overshooting
      const proteinRatio = pLeft > 0 ? m.protein / (pLeft / total) : 0;
      const carbsRatio = cLeft > 0 ? m.carbs / (cLeft / total) : 0;
      const fatRatio = fLeft > 0 ? m.fat / (fLeft / total) : 0;
      const score = proteinRatio + carbsRatio + fatRatio;

      // Find optimal amount (cap by kcal budget and macro needs)
      let amount;
      if (food.unit === 'g') {
        const byKcal = kcalLeft / m.kcal;
        const byProtein = pLeft > 5 && m.protein > 0 ? pLeft / m.protein : Infinity;
        const byCarbs = cLeft > 5 && m.carbs > 0 ? cLeft / m.carbs : Infinity;
        const byFat = fLeft > 5 && m.fat > 0 ? fLeft / m.fat : Infinity;
        amount = Math.min(byKcal, byProtein, byCarbs, byFat);
        amount = Math.round(amount / food.step) * food.step;
        amount = Math.max(food.step, Math.min(amount, 300));
      } else {
        const byKcal = kcalLeft / m.kcal;
        amount = Math.max(1, Math.min(Math.floor(byKcal), 4));
      }

      const n = getNutrition(food.id, amount);
      if (n.kcal > kcalLeft * 1.1) continue;

      const fillScore = score * Math.min(n.kcal / kcalLeft, 1);
      candidates.push({ food, amount, nutrition: n, score: fillScore });
    }

    if (candidates.length === 0) break;

    // Pick from top 3 candidates randomly instead of always the best
    candidates.sort((a, b) => b.score - a.score);
    const topN = candidates.slice(0, Math.min(3, candidates.length));
    const pick = topN[Math.floor(Math.random() * topN.length)];

    suggestions.push({ food: pick.food, amount: pick.amount, nutrition: pick.nutrition });
    usedFoods.add(pick.food.id);
    pLeft -= pick.nutrition.protein_g;
    cLeft -= pick.nutrition.carbs_g;
    fLeft -= pick.nutrition.fat_g;
    kcalLeft -= pick.nutrition.kcal;
  }

  return suggestions;
}

export default function MealSuggester({ remainingProtein, remainingCarbs, remainingFat, remainingKcal, onAddItems }) {
  const [suggestions, setSuggestions] = useState(null);
  const [showSuggester, setShowSuggester] = useState(false);

  const handleSuggest = () => {
    const result = suggestMeal(remainingProtein, remainingCarbs, remainingFat, remainingKcal);
    setSuggestions(result);
    setShowSuggester(true);
  };

  const totalNutrition = suggestions?.reduce((acc, s) => ({
    kcal: acc.kcal + s.nutrition.kcal,
    protein_g: acc.protein_g + s.nutrition.protein_g,
    carbs_g: acc.carbs_g + s.nutrition.carbs_g,
    fat_g: acc.fat_g + s.nutrition.fat_g,
  }), { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

  if (remainingKcal < 50 && remainingProtein < 5 && remainingCarbs < 5) {
    return null; // Already hit targets
  }

  return (
    <div className="mt-3">
      {!showSuggester ? (
        <button
          onClick={handleSuggest}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl text-sm hover:from-amber-500 hover:to-orange-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <span>🤖</span> Suggest a Meal to Hit Macros
        </button>
      ) : (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-amber-800 flex items-center gap-1">
              <span>🤖</span> Suggested Combo
            </span>
            <button onClick={() => setShowSuggester(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
          </div>

          {suggestions && suggestions.length > 0 ? (
            <>
              <div className="space-y-2 mb-3">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{s.food.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{s.food.name}</div>
                        <div className="text-xs text-gray-500">
                          {s.amount}{s.food.unit === 'g' ? 'g' : ` ${s.food.unit}${s.amount > 1 ? 's' : ''}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div className="font-bold text-gray-700">{Math.round(s.nutrition.kcal)} kcal</div>
                      <div>P:{Math.round(s.nutrition.protein_g)} C:{Math.round(s.nutrition.carbs_g)} F:{Math.round(s.nutrition.fat_g)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between bg-amber-100 rounded-lg px-3 py-2 mb-3">
                <span className="text-xs font-bold text-amber-700">Total</span>
                <span className="text-xs font-bold text-amber-800">
                  {Math.round(totalNutrition.kcal)} kcal — P:{Math.round(totalNutrition.protein_g)}g C:{Math.round(totalNutrition.carbs_g)}g F:{Math.round(totalNutrition.fat_g)}g
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const items = suggestions.map(s => ({ food_id: s.food.id, amount: s.amount }));
                    onAddItems(items);
                    setShowSuggester(false);
                    setSuggestions(null);
                  }}
                  className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-sm transition-colors"
                >
                  Add to Meal
                </button>
                <button
                  onClick={handleSuggest}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-sm transition-colors"
                >
                  🔄
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-amber-700">No good combination found for the remaining macros. Try logging some food manually.</p>
          )}
        </div>
      )}
    </div>
  );
}
