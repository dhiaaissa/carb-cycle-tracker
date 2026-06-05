import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const CATEGORY_INFO = {
  base:    { label: 'Base Foods',  emoji: '🌿' },
  protein: { label: 'Proteins',    emoji: '💪' },
  bread:   { label: 'Bread',       emoji: '🍞' },
  snack:   { label: 'Snacks',      emoji: '🥜' },
  fruit:   { label: 'Fruits',      emoji: '🍎' },
  custom:  { label: 'Custom',      emoji: '⭐' },
  other:   { label: 'Other',       emoji: '🍽️' },
};

// Tunisian market prices (approximate, in TND)
const PRICES_TND = {
  eggs:              { price: 0.35, per: 'piece', label: '0.350 DT/egg' },
  bulgur_cooked:     { price: 2.5,  per: 'kg',    label: '2.500 DT/kg' },
  potatoes_boiled:   { price: 1.8,  per: 'kg',    label: '1.800 DT/kg' },
  rice_cooked:       { price: 3.2,  per: 'kg',    label: '3.200 DT/kg' },
  slata_mechouia:    { price: 5.0,  per: 'kg',    label: '5.000 DT/kg' },
  cucumber:          { price: 1.5,  per: 'kg',    label: '1.500 DT/kg' },
  yaarout:           { price: 1.2,  per: 'pot',   label: '1.200 DT/pot' },
  tuna_canned:       { price: 4.5,  per: 'can',   label: '4.500 DT/can (160g)' },
  minced_meat:       { price: 28.0, per: 'kg',    label: '28.000 DT/kg' },
  chicken_breast:    { price: 18.0, per: 'kg',    label: '18.000 DT/kg' },
  bread_taaouna:     { price: 0.5,  per: 'piece', label: '0.500 DT/piece (~200g)' },
  bread_white:       { price: 0.39, per: 'piece', label: '0.390 DT/baguette (~250g)' },
  bread_cereal:      { price: 1.5,  per: 'piece', label: '1.500 DT/piece (~300g)' },
  almonds:           { price: 45.0, per: 'kg',    label: '45.000 DT/kg' },
  coca_cola_zero:    { price: 1.8,  per: 'can',   label: '1.800 DT/can (330ml)' },
  strawberries:      { price: 6.0,  per: 'kg',    label: '6.000 DT/kg' },
  peaches:           { price: 4.5,  per: 'kg',    label: '4.500 DT/kg (~4 pieces/kg)' },
};

function estimatePrice(foodId, amount, unit) {
  const p = PRICES_TND[foodId];
  if (!p) return null;

  if (p.per === 'piece' || p.per === 'pot') {
    return p.price * amount;
  }
  if (p.per === 'can') {
    // tuna: 160g per can, cola: 330ml per can
    const canSize = foodId === 'tuna_canned' ? 160 : 330;
    return p.price * Math.ceil(amount / canSize);
  }
  if (p.per === 'kg') {
    return p.price * (amount / 1000);
  }
  // bread by piece weight
  if (foodId === 'bread_taaouna') return p.price * Math.ceil(amount / 200);
  if (foodId === 'bread_white') return p.price * Math.ceil(amount / 250);
  if (foodId === 'bread_cereal') return p.price * Math.ceil(amount / 300);

  return null;
}

export default function GroceryPage({ config, allFoods }) {
  const [foods, setFoods] = useState({});
  const [cart, setCart] = useState({}); // food_id -> { amount, checked }
  const [loading, setLoading] = useState(true);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    loadFoods();
  }, []);

  async function loadFoods() {
    setLoading(true);
    try {
      const data = await api.getFoods();
      setFoods(data.foods || {});

      // Also load suggestion from patterns
      try {
        const sug = await api.getGroceryList(7);
        setSuggestion(sug);
      } catch {}
    } catch (err) {
      console.error('Failed to load foods:', err);
    }
    setLoading(false);
  }

  function addToCart(foodId) {
    const food = foods[foodId];
    if (!food) return;
    setCart(prev => ({
      ...prev,
      [foodId]: {
        amount: prev[foodId]?.amount || food.default_amount * 7,
        checked: false,
      },
    }));
  }

  function removeFromCart(foodId) {
    setCart(prev => {
      const next = { ...prev };
      delete next[foodId];
      return next;
    });
  }

  function updateAmount(foodId, amount) {
    setCart(prev => ({
      ...prev,
      [foodId]: { ...prev[foodId], amount: Math.max(0, amount) },
    }));
  }

  function toggleChecked(foodId) {
    setCart(prev => ({
      ...prev,
      [foodId]: { ...prev[foodId], checked: !prev[foodId]?.checked },
    }));
  }

  function loadSuggestion() {
    if (!suggestion?.grocery_list) return;
    const newCart = {};
    suggestion.grocery_list.forEach(item => {
      newCart[item.food_id] = { amount: item.amount, checked: false };
    });
    setCart(newCart);
  }

  function formatAmount(food, amount) {
    if (food.unit === 'g') {
      if (amount >= 1000) return `${(amount / 1000).toFixed(1)}kg`;
      return `${amount}g`;
    }
    return `${amount} ${food.unit}${amount > 1 ? 's' : ''}`;
  }

  function getStep(food) {
    if (food.unit === 'g') return 50;
    return 1;
  }

  // Compute total cost
  const cartItems = Object.entries(cart).map(([foodId, { amount, checked }]) => {
    const food = foods[foodId];
    if (!food) return null;
    const price = estimatePrice(foodId, amount, food.unit);
    return { foodId, food, amount, checked, price };
  }).filter(Boolean);

  const totalCost = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const checkedCount = cartItems.filter(i => i.checked).length;

  // Group all foods by category for the picker
  const foodsByCategory = {};
  Object.values(foods).forEach(food => {
    const cat = food.category || 'other';
    if (!foodsByCategory[cat]) foodsByCategory[cat] = [];
    foodsByCategory[cat].push(food);
  });

  function copyToClipboard() {
    const lines = ['🛒 Grocery List\n'];
    const grouped = {};
    cartItems.forEach(item => {
      const cat = item.food.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    Object.entries(grouped).forEach(([cat, items]) => {
      const catInfo = CATEGORY_INFO[cat] || CATEGORY_INFO.other;
      lines.push(`${catInfo.emoji} ${catInfo.label}`);
      items.forEach(item => {
        const check = item.checked ? '✓' : '○';
        const priceStr = item.price != null ? ` (~${item.price.toFixed(3)} DT)` : '';
        lines.push(`  ${check} ${item.food.emoji} ${item.food.name} — ${formatAmount(item.food, item.amount)}${priceStr}`);
      });
      lines.push('');
    });
    lines.push(`💰 Total estimé: ${totalCost.toFixed(3)} DT`);
    navigator.clipboard.writeText(lines.join('\n'));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1 flex items-center gap-3">
          <span>🛒</span> Grocery List
        </h1>
        <p className="text-gray-500">Pick your items, adjust amounts, see the estimated cost</p>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 mb-6 shadow-lg flex flex-wrap items-center gap-3">
        {suggestion?.grocery_list?.length > 0 && (
          <button
            onClick={loadSuggestion}
            className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
          >
            🤖 Load from meal patterns
          </button>
        )}
        {cartItems.length > 0 && (
          <button
            onClick={() => setCart({})}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
          >
            🗑️ Clear all
          </button>
        )}
        {cartItems.length > 0 && (
          <button
            onClick={copyToClipboard}
            className="ml-auto bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
          >
            📋 Copy List
          </button>
        )}
      </div>

      {/* Food Picker — all available foods */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 mb-6 shadow-lg">
        <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span>➕</span> Add Items
        </h2>
        <div className="space-y-4">
          {Object.entries(foodsByCategory).map(([cat, catFoods]) => {
            const catInfo = CATEGORY_INFO[cat] || CATEGORY_INFO.other;
            return (
              <div key={cat}>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {catInfo.emoji} {catInfo.label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {catFoods.map(food => {
                    const inCart = !!cart[food.id || food.food_id];
                    const id = food.id || food.food_id;
                    const priceInfo = PRICES_TND[id];
                    return (
                      <button
                        key={id}
                        onClick={() => inCart ? removeFromCart(id) : addToCart(id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          inCart
                            ? 'bg-green-100 text-green-800 ring-2 ring-green-400 shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={priceInfo ? priceInfo.label : ''}
                      >
                        <span>{food.emoji}</span>
                        <span>{food.name}</span>
                        {inCart && <span className="text-green-600">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart — selected items with amounts */}
      {cartItems.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 mb-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold">{cartItems.length}</span>
                <span className="text-sm text-green-100 ml-2">items in list</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{checkedCount}/{cartItems.length}</span>
                <span className="text-sm text-green-100 ml-1">checked</span>
              </div>
            </div>
            {cartItems.length > 0 && (
              <div className="mt-2 w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-300"
                  style={{ width: `${Math.round((checkedCount / cartItems.length) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Items with adjustable amounts */}
          <div className="space-y-3 mb-6">
            {cartItems.map(({ foodId, food, amount, checked, price }) => (
              <div
                key={foodId}
                className={`bg-white rounded-xl border-2 ${checked ? 'border-green-200 opacity-60' : 'border-gray-100'} p-4 shadow-sm transition-all`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleChecked(foodId)}
                    className="w-5 h-5 rounded-md border-2 border-gray-300 text-green-500 focus:ring-green-400 shrink-0"
                  />
                  <span className="text-2xl">{food.emoji}</span>
                  <div className={`flex-1 min-w-0 ${checked ? 'line-through text-gray-400' : ''}`}>
                    <div className="font-semibold text-gray-800">{food.name}</div>
                    {PRICES_TND[foodId] && (
                      <div className="text-xs text-gray-400">{PRICES_TND[foodId].label}</div>
                    )}
                  </div>

                  {/* Amount controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateAmount(foodId, amount - getStep(food))}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-lg flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <div className="w-20 text-center font-bold text-indigo-700 bg-indigo-50 py-1 rounded-lg text-sm">
                      {formatAmount(food, amount)}
                    </div>
                    <button
                      onClick={() => updateAmount(foodId, amount + getStep(food))}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-lg flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Price */}
                  {price != null && (
                    <div className="text-right shrink-0 w-20">
                      <div className="font-bold text-green-700 text-sm">{price.toFixed(3)}</div>
                      <div className="text-[10px] text-gray-400">DT</div>
                    </div>
                  )}

                  <button
                    onClick={() => removeFromCart(foodId)}
                    className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total cost */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-amber-100">Estimated Total (Tunisian Market)</div>
                <div className="text-3xl font-bold mt-1">{totalCost.toFixed(3)} DT</div>
              </div>
              <div className="text-right text-5xl">💰</div>
            </div>
            <div className="mt-3 text-xs text-amber-100">
              * Prices are approximate based on Tunisian market averages. Actual prices may vary by store and season.
            </div>
          </div>
        </>
      )}

      {cartItems.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
          <div className="text-4xl mb-3">👆</div>
          <p className="text-gray-500 font-medium">Click on foods above to add them to your list</p>
          {suggestion?.grocery_list?.length > 0 && (
            <p className="text-gray-400 text-sm mt-1">Or click "🤖 Load from meal patterns" for a smart suggestion</p>
          )}
        </div>
      )}
    </div>
  );
}
