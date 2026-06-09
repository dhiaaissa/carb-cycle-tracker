import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FOODS as BUILTIN_FOODS, FOOD_CATEGORIES, getNutrition as builtinGetNutrition, sumMealNutrition as builtinSumMealNutrition } from '../lib/foods';

const UNIT_LABEL = { g: 'g', piece: 'pcs', pot: 'pot', slice: 'slices' };
const MEAL_ICONS = ['☀️', '🌤️', '🌙', '🍪'];
const EMOJI_OPTIONS = ['🍽️','🥗','🧀','🫒','🥜','🍳','🥙','🌶️','🫘','🥦','🍕','🌽','🥥','🫓','🍖','🥤','🧈','🍯','🥣','🍲'];

/** Get nutrition using merged food db (handles both built-in and custom) */
function getFoodNutrition(foodDb, foodId, amount) {
  const food = foodDb[foodId];
  if (!food || !amount || amount <= 0) return { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  if (food.unit === 'g') {
    const r = amount / 100;
    return {
      kcal: (food.kcal_per_100g || 0) * r,
      protein_g: (food.protein_per_100g || 0) * r,
      carbs_g: (food.carbs_per_100g || 0) * r,
      fat_g: (food.fat_per_100g || 0) * r,
    };
  }
  return {
    kcal: (food.kcal_per_unit || 0) * amount,
    protein_g: (food.protein_per_unit || 0) * amount,
    carbs_g: (food.carbs_per_unit || 0) * amount,
    fat_g: (food.fat_per_unit || 0) * amount,
  };
}

function sumNutrition(foodDb, items = []) {
  return items.reduce((acc, item) => {
    const n = getFoodNutrition(foodDb, item.food_id, item.amount);
    return { kcal: acc.kcal + n.kcal, protein_g: acc.protein_g + n.protein_g, carbs_g: acc.carbs_g + n.carbs_g, fat_g: acc.fat_g + n.fat_g };
  }, { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
}

export default function MealComposer({ mealNum, items = [], onChange, disabled, presets = [], onSavePreset, onDeletePreset, allFoods, onCreateCustomFood, onDeleteCustomFood }) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [search, setSearch] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const searchRef = useRef(null);

  const foodDb = allFoods && Object.keys(allFoods).length > 0 ? allFoods : BUILTIN_FOODS;

  const categories = useMemo(() => {
    const cats = [...FOOD_CATEGORIES];
    const hasCustom = Object.values(foodDb).some(f => f.custom || f.category === 'custom');
    if (hasCustom && !cats.some(c => c.key === 'custom')) {
      cats.push({ key: 'custom', label: t('composer.myFoods'), emoji: '⭐' });
    }
    return cats;
  }, [foodDb]);

  const mealNutrition = sumNutrition(foodDb, items);
  const hasItems = items.length > 0;

  useEffect(() => {
    if (pickerOpen && searchRef.current) searchRef.current.focus();
  }, [pickerOpen]);

  function quickAdd(foodId) {
    if (disabled) return;
    const food = foodDb[foodId];
    if (!food) return;
    const existing = items.findIndex(it => it.food_id === foodId);
    if (existing >= 0) {
      onChange(items.map((item, i) =>
        i === existing ? { ...item, amount: item.amount + food.step } : item
      ));
    } else {
      onChange([...items, { food_id: foodId, amount: food.default_amount }]);
    }
  }

  function removeItem(index) { onChange(items.filter((_, i) => i !== index)); }

  function nudge(index, delta) {
    const food = foodDb[items[index].food_id];
    if (!food) return;
    const newAmt = items[index].amount + (delta * food.step);
    if (newAmt <= 0) return removeItem(index);
    onChange(items.map((item, i) => i === index ? { ...item, amount: newAmt } : item));
  }

  function startEdit(index) {
    setEditingIndex(index);
    setEditingAmount(String(items[index].amount));
  }

  function commitEdit(index) {
    const val = Number(editingAmount);
    if (!val || val <= 0) { removeItem(index); }
    else { onChange(items.map((item, i) => i === index ? { ...item, amount: val } : item)); }
    setEditingIndex(null);
  }

  const filteredFoods = search.trim()
    ? Object.values(foodDb).filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.id.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-200 ${
      hasItems ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-50/80 border border-dashed border-gray-300'
    }`}>
      {/* Meal header */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between cursor-pointer select-none transition-colors ${
          hasItems ? 'hover:bg-gray-50' : 'hover:bg-gray-100/60'
        }`}
        onClick={() => !disabled && setPickerOpen(o => !o)}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{MEAL_ICONS[mealNum - 1]}</span>
          <span className="font-bold text-sm text-gray-800">{t(`meal.${mealNum}`)}</span>
          {hasItems && <span className="text-xs text-gray-400">{t('composer.itemsCount', { count: items.length })}</span>}
        </div>
        <div className="flex items-center gap-3">
          {hasItems && (
            <div className="text-end">
              <span className="text-sm font-bold text-gray-700">{Math.round(mealNutrition.kcal)}</span>
              <span className="text-xs text-gray-400 ms-0.5">{t('composer.kcal')}</span>
              <div className="flex gap-2 text-[10px] mt-0.5">
                <span className="text-red-500 font-semibold">{t('macro.protein_short')}{Math.round(mealNutrition.protein_g)}</span>
                <span className="text-amber-500 font-semibold">{t('macro.carbs_short')}{Math.round(mealNutrition.carbs_g)}</span>
                <span className="text-blue-400 font-semibold">{t('macro.fat_short')}{Math.round(mealNutrition.fat_g)}</span>
              </div>
            </div>
          )}
          {!disabled && (
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
              pickerOpen ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'bg-gray-100 text-gray-400'
            }`}>▾</div>
          )}
        </div>
      </div>

      {/* Item list */}
      {hasItems && (
        <div className="px-3 pb-2 space-y-1">
          {!disabled && onSavePreset && (
            <div className="flex items-center gap-1.5 pb-1">
              {savingPreset ? (
                <form className="flex items-center gap-1.5 flex-1" onSubmit={async (e) => {
                  e.preventDefault();
                  if (!presetName.trim()) return;
                  await onSavePreset(presetName.trim(), items);
                  setSavingPreset(false); setPresetName('');
                }}>
                  <input type="text" value={presetName} onChange={e => setPresetName(e.target.value)}
                    placeholder={t('composer.presetNamePlaceholder')} autoFocus
                    className="flex-1 text-xs border border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500" />
                  <button type="submit" disabled={!presetName.trim()}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-30 px-1.5">{t('action.save')}</button>
                  <button type="button" onClick={() => { setSavingPreset(false); setPresetName(''); }}
                    className="text-xs text-gray-400 hover:text-gray-600 px-1">{t('action.cancel')}</button>
                </form>
              ) : (
                <button onClick={() => setSavingPreset(true)}
                  className="text-[11px] text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">
                  {t('composer.saveAsPreset')}
                </button>
              )}
            </div>
          )}

          {items.map((item, i) => {
            const f = foodDb[item.food_id];
            if (!f) return null;
            const n = getFoodNutrition(foodDb, item.food_id, item.amount);
            const isEditing = editingIndex === i;
            return (
              <div key={i} className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 bg-gray-50 transition-colors">
                <span className="text-base shrink-0">{f.emoji}</span>
                <span className="flex-1 text-xs font-medium text-gray-700 truncate min-w-0">{f.name}</span>
                <span className="text-[10px] text-gray-400 shrink-0">{Math.round(n.kcal)}kcal</span>
                {!disabled && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => nudge(i, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 text-sm font-bold flex items-center justify-center transition-colors active:scale-95">−</button>
                    {isEditing ? (
                      <input type="number" value={editingAmount}
                        onChange={e => setEditingAmount(e.target.value)}
                        onBlur={() => commitEdit(i)}
                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(i); if (e.key === 'Escape') setEditingIndex(null); }}
                        onClick={e => e.stopPropagation()}
                        className="w-14 text-xs border-2 border-indigo-400 rounded-lg px-1 py-1 text-center font-bold focus:outline-none"
                        autoFocus min={f.step} step={f.step} />
                    ) : (
                      <button onClick={() => startEdit(i)}
                        className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg min-w-[48px] text-center transition-colors">
                        {item.amount}{UNIT_LABEL[f.unit] || f.unit}
                      </button>
                    )}
                    <button onClick={() => nudge(i, +1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:bg-green-50 hover:border-green-300 hover:text-green-600 text-sm font-bold flex items-center justify-center transition-colors active:scale-95">+</button>
                    <button onClick={() => removeItem(i)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:bg-red-50 hover:border-red-300 text-red-400 hover:text-red-600 text-xs font-bold flex items-center justify-center transition-colors active:scale-95 ms-0.5">×</button>
                  </div>
                )}
                {disabled && (
                  <span className="text-xs font-semibold text-gray-500 shrink-0">{item.amount}{UNIT_LABEL[f.unit] || f.unit}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Food picker */}
      {!disabled && pickerOpen && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-3 py-3 space-y-2.5">
          <input ref={searchRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('composer.searchFood')}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 bg-white placeholder-gray-400" />

          {/* Presets */}
          {presets.length > 0 && !search && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">{t('composer.savedPresets')}</div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map(p => (
                  <div key={p.id} className="inline-flex items-center gap-0.5">
                    <button onClick={() => { onChange(p.items_json); setPickerOpen(false); setSearch(''); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300 transition-all active:scale-95">
                      ⭐ {p.name}
                    </button>
                    {onDeletePreset && (
                      <button onClick={() => onDeletePreset(p.id)}
                        className="w-5 h-5 rounded-lg text-[10px] text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors">×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {search && filteredFoods && (
            <div>
              {filteredFoods.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">{t('composer.noFoodFound')}</p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {filteredFoods.map(f => (
                    <FoodButton key={f.id} food={f} foodDb={foodDb} items={items} onTap={quickAdd} onDelete={f.custom ? onDeleteCustomFood : null} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Food grid by category */}
          {!search && categories.map(cat => {
            const catFoods = Object.values(foodDb).filter(f => f.category === cat.key);
            if (catFoods.length === 0) return null;
            return (
              <div key={cat.key}>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">
                  {cat.emoji} {cat.label}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {catFoods.map(f => (
                    <FoodButton key={f.id} food={f} foodDb={foodDb} items={items} onTap={quickAdd} onDelete={f.custom ? onDeleteCustomFood : null} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Create custom food button */}
          {!search && onCreateCustomFood && (
            <div className="pt-1">
              {showCustomForm ? (
                <CustomFoodForm
                  onCreate={async (data) => {
                    await onCreateCustomFood(data);
                    setShowCustomForm(false);
                  }}
                  onCancel={() => setShowCustomForm(false)}
                />
              ) : (
                <button onClick={() => setShowCustomForm(true)}
                  className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                  <span className="text-lg">+</span> {t('composer.createCustom')}
                </button>
              )}
            </div>
          )}

          <p className="text-[10px] text-gray-400 text-center pt-1">
            {t('composer.tapToAdd')}
          </p>
        </div>
      )}

      {/* Add button when picker is closed */}
      {!disabled && !pickerOpen && !hasItems && (
        <div className="px-3 pb-2.5 pt-0.5">
          <button onClick={() => setPickerOpen(true)}
            className="w-full py-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
            {t('composer.addFood')}
          </button>
        </div>
      )}
    </div>
  );
}

/** Food button */
function FoodButton({ food, foodDb, items, onTap, onDelete }) {
  const { t } = useTranslation();
  const inMeal = items.some(it => it.food_id === food.id);
  const defaultN = getFoodNutrition(foodDb, food.id, food.default_amount);
  const unitLabel = food.unit === 'g' ? `${food.default_amount}g` : `${food.default_amount}`;

  return (
    <div className="relative">
      <button
        onClick={() => onTap(food.id)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-start transition-all active:scale-95 ${
          inMeal
            ? 'bg-indigo-50 border-2 border-indigo-300 shadow-sm'
            : 'bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm'
        }`}
      >
        <span className="text-xl shrink-0">{food.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-gray-800 truncate">{food.name.split('(')[0].trim()}</div>
          <div className="text-[10px] text-gray-400">{unitLabel} · {Math.round(defaultN.kcal)}{t('composer.kcal')}</div>
        </div>
        {inMeal && (
          <span className="absolute -top-1 -end-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow">+</span>
        )}
      </button>
      {onDelete && !inMeal && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(food.id); }}
          className="absolute -top-1.5 -start-1.5 w-5 h-5 bg-red-100 hover:bg-red-200 text-red-500 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors shadow"
          title={t('composer.deleteCustom')}>×</button>
      )}
    </div>
  );
}

/** Custom food creation form */
function CustomFoodForm({ onCreate, onCancel }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍽️');
  const [unit, setUnit] = useState('g');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !kcal) return;
    setSaving(true);
    try {
      await onCreate({
        name: name.trim(),
        emoji,
        unit,
        kcal: parseFloat(kcal) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
      });
    } catch (err) {
      console.error('Failed to create custom food:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border-2 border-indigo-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-gray-800">{t('customFood.title')}</span>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>

      {/* Name + Emoji */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">{t('customFood.name')}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder={t('customFood.namePlaceholder')} autoFocus required
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400" />
        </div>
        <div className="w-20">
          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">{t('customFood.emoji')}</label>
          <select value={emoji} onChange={e => setEmoji(e.target.value)}
            className="w-full text-xl border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 bg-white text-center">
            {EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Unit */}
      <div>
        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">{t('customFood.unit')}</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setUnit('g')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${unit === 'g' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t('customFood.unitGrams')}
          </button>
          <button type="button" onClick={() => setUnit('piece')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${unit === 'piece' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t('customFood.unitPiece')}
          </button>
        </div>
      </div>

      {/* Macros */}
      <div>
        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
          {t('customFood.nutrition', { per: unit === 'g' ? t('customFood.per100g') : t('customFood.perPiece') })}
        </label>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <div className="text-[10px] text-gray-400 mb-0.5 text-center">{t('customFood.kcal')}</div>
            <input type="number" step="0.1" value={kcal} onChange={e => setKcal(e.target.value)}
              placeholder="0" required
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-center font-bold focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <div className="text-[10px] text-red-400 mb-0.5 text-center">{t('macro.protein')}</div>
            <input type="number" step="0.1" value={protein} onChange={e => setProtein(e.target.value)}
              placeholder="0"
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-center font-bold focus:outline-none focus:border-red-400" />
          </div>
          <div>
            <div className="text-[10px] text-amber-500 mb-0.5 text-center">{t('macro.carbs')}</div>
            <input type="number" step="0.1" value={carbs} onChange={e => setCarbs(e.target.value)}
              placeholder="0"
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-center font-bold focus:outline-none focus:border-amber-400" />
          </div>
          <div>
            <div className="text-[10px] text-blue-400 mb-0.5 text-center">{t('macro.fat')}</div>
            <input type="number" step="0.1" value={fat} onChange={e => setFat(e.target.value)}
              placeholder="0"
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-center font-bold focus:outline-none focus:border-blue-400" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={!name.trim() || !kcal || saving}
        className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-40 active:scale-[0.98]">
        {saving ? t('customFood.creating') : t('customFood.create', { name: name || t('customFood.foodDefault') })}
      </button>
    </form>
  );
}
