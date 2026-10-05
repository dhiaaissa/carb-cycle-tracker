import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Lightning, ArrowCounterClockwise, ClockCounterClockwise } from '@phosphor-icons/react';
import { itemNutrition, sumItems, makeQuickItem, isQuick } from '../../../shared/mealItems.js';
import { useFoodHistory, toggleFavorite } from '../lib/foodHistory';
import { FOODS as BUILTIN_FOODS, FOOD_CATEGORIES, getNutrition as builtinGetNutrition, sumMealNutrition as builtinSumMealNutrition } from '../lib/foods';

const UNIT_LABEL = { g: 'g', piece: 'pcs', pot: 'pot', slice: 'slices' };
import { MEAL_ICON_COMPONENTS } from '../lib/mealIcons.jsx';

const MEAL_ICON_LIST = Object.values(MEAL_ICON_COMPONENTS);
const EMOJI_OPTIONS = ['🍽️','🥗','🧀','🫒','🥜','🍳','🥙','🌶️','🫘','🥦','🍕','🌽','🥥','🫓','🍖','🥤','🧈','🍯','🥣','🍲'];

const getFoodNutrition = (foodDb, foodId, amount) => itemNutrition({ food_id: foodId, amount }, foodDb);
const sumNutrition = (foodDb, items = []) => sumItems(items, foodDb);

export default function MealComposer({ mealNum, items = [], onChange, disabled, presets = [], onSavePreset, onDeletePreset, allFoods, onCreateCustomFood, onDeleteCustomFood, yesterdayItems }) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [search, setSearch] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const searchRef = useRef(null);
  const history = useFoodHistory();
  const [quickOpen, setQuickOpen] = useState(false);
  const [quick, setQuick] = useState({ label: '', kcal: '', protein_g: '', carbs_g: '', fat_g: '' });

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

  /** Re-log a food with the amount you used last time. */
  function addWithAmount(foodId, amount) {
    if (disabled || !foodDb[foodId]) return;
    if (items.some((it) => it.food_id === foodId)) return quickAdd(foodId);
    onChange([...items, { food_id: foodId, amount }]);
  }

  function addQuick(e) {
    e.preventDefault();
    const item = makeQuickItem(quick);
    if (!item.kcal) return;
    onChange([...items, item]);
    setQuick({ label: '', kcal: '', protein_g: '', carbs_g: '', fat_g: '' });
    setQuickOpen(false);
  }

  const yesterdayKcal = yesterdayItems?.length ? Math.round(sumNutrition(foodDb, yesterdayItems).kcal) : 0;
  const favorites = history.favorites.filter((id) => foodDb[id]);
  const lastAmount = (id) => history.recent.find((r) => r.food_id === id)?.amount ?? foodDb[id]?.default_amount;
  const recent = history.recent.filter((r) => foodDb[r.food_id] && !history.favorites.includes(r.food_id)).slice(0, 8);
  const amountLabel = (f, amount) => `${amount}${UNIT_LABEL[f.unit] || f.unit}`;

  function removeItem(index) { onChange(items.filter((_, i) => i !== index)); }

  function nudge(index, delta) {
    if (isQuick(items[index])) return;
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
      hasItems ? 'bg-white border border-ink-200 shadow-sm' : 'bg-ink-50/80 border border-dashed border-ink-300'
    }`}>
      {/* Meal header */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between cursor-pointer select-none transition-colors ${
          hasItems ? 'hover:bg-ink-50' : 'hover:bg-ink-100/60'
        }`}
        onClick={() => !disabled && setPickerOpen(o => !o)}
      >
        <div className="flex items-center gap-2.5">
          {(() => { const Icon = MEAL_ICON_LIST[mealNum - 1]; return <Icon size={20} className="text-ink-500" aria-hidden="true" />; })()}
          <span className="font-bold text-sm text-ink-800">{t(`meal.${mealNum}`)}</span>
          {hasItems && <span className="text-xs text-ink-400">{t('composer.itemsCount', { count: items.length })}</span>}
        </div>
        <div className="flex items-center gap-3">
          {hasItems && (
            <div className="text-end">
              <span className="text-sm font-bold text-ink-700">{Math.round(mealNutrition.kcal)}</span>
              <span className="text-xs text-ink-400 ms-0.5">{t('composer.kcal')}</span>
              <div className="flex gap-2 text-[10px] mt-0.5">
                <span className="text-door-700 font-semibold">{t('macro.protein_short')}{Math.round(mealNutrition.protein_g)}</span>
                <span className="text-saffron-700 font-semibold">{t('macro.carbs_short')}{Math.round(mealNutrition.carbs_g)}</span>
                <span className="text-olive-700 font-semibold">{t('macro.fat_short')}{Math.round(mealNutrition.fat_g)}</span>
              </div>
            </div>
          )}
          {!disabled && (
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
              pickerOpen ? 'bg-door-100 text-door-600 rotate-180' : 'bg-ink-100 text-ink-400'
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
                    className="flex-1 text-xs border border-door-300 rounded-lg px-2 py-1 focus:outline-none focus:border-door-500" />
                  <button type="submit" disabled={!presetName.trim()}
                    className="text-xs font-bold text-door-600 hover:text-door-800 disabled:opacity-30 px-1.5">{t('action.save')}</button>
                  <button type="button" onClick={() => { setSavingPreset(false); setPresetName(''); }}
                    className="text-xs text-ink-400 hover:text-ink-600 px-1">{t('action.cancel')}</button>
                </form>
              ) : (
                <button onClick={() => setSavingPreset(true)}
                  className="text-[11px] text-door-500 hover:text-door-700 font-semibold transition-colors">
                  {t('composer.saveAsPreset')}
                </button>
              )}
            </div>
          )}

          {items.map((item, i) => {
            if (isQuick(item)) {
              return (
                <div key={i} className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 bg-ink-50">
                  <Lightning size={16} weight="fill" className="text-saffron-500 shrink-0" aria-hidden="true" />
                  <span className="flex-1 text-xs font-medium text-ink-700 truncate min-w-0">{item.label || t('composer.quickItem')}</span>
                  <span className="text-[10px] text-ink-500 shrink-0 tabular-nums">{item.kcal}kcal</span>
                  {!disabled && (
                    <button onClick={() => removeItem(i)} aria-label={t('composer.remove')}
                      className="w-7 h-7 rounded-lg bg-white border border-ink-200 hover:bg-ink-100 text-ink-500 hover:text-ink-900 text-xs font-bold flex items-center justify-center ms-0.5">×</button>
                  )}
                </div>
              );
            }
            const f = foodDb[item.food_id];
            if (!f) return null;
            const n = getFoodNutrition(foodDb, item.food_id, item.amount);
            const isEditing = editingIndex === i;
            return (
              <div key={i} className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 bg-ink-50 transition-colors">
                <span className="text-base shrink-0">{f.emoji}</span>
                <span className="flex-1 text-xs font-medium text-ink-700 truncate min-w-0">{f.name}</span>
                <span className="text-[10px] text-ink-400 shrink-0">{Math.round(n.kcal)}kcal</span>
                {!disabled && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => nudge(i, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-ink-200 hover:bg-ink-100 text-sm font-bold flex items-center justify-center transition-colors active:scale-95">−</button>
                    {isEditing ? (
                      <input type="number" value={editingAmount}
                        onChange={e => setEditingAmount(e.target.value)}
                        onBlur={() => commitEdit(i)}
                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(i); if (e.key === 'Escape') setEditingIndex(null); }}
                        onClick={e => e.stopPropagation()}
                        className="w-14 text-xs border border-door-400 rounded-lg px-1 py-1 text-center font-bold focus:outline-none"
                        autoFocus min={f.step} step={f.step} />
                    ) : (
                      <button onClick={() => startEdit(i)}
                        className="text-xs font-bold text-door-600 hover:bg-door-50 px-2 py-1 rounded-lg min-w-[48px] text-center transition-colors">
                        {item.amount}{UNIT_LABEL[f.unit] || f.unit}
                      </button>
                    )}
                    <button onClick={() => nudge(i, +1)}
                      className="w-7 h-7 rounded-lg bg-white border border-ink-200 hover:bg-olive-50 hover:border-olive-300 hover:text-olive-600 text-sm font-bold flex items-center justify-center transition-colors active:scale-95">+</button>
                    <button onClick={() => removeItem(i)}
                      className="w-7 h-7 rounded-lg bg-white border border-ink-200 hover:bg-ink-100 text-ink-500 hover:text-ink-900 text-xs font-bold flex items-center justify-center transition-colors active:scale-95 ms-0.5">×</button>
                  </div>
                )}
                {disabled && (
                  <span className="text-xs font-semibold text-ink-500 shrink-0">{item.amount}{UNIT_LABEL[f.unit] || f.unit}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Food picker */}
      {!disabled && pickerOpen && (
        <div className="border-t border-ink-100 bg-ink-50/50 px-3 py-3 space-y-2.5">
          <input ref={searchRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('composer.searchFood')}
            className="w-full text-sm border border-ink-200 rounded-xl px-3 py-2 focus:outline-none focus:border-door-400 bg-white placeholder-ink-400" />

          {!search && (
            <div className="space-y-2.5">
              {/* Quick add calories: restaurant meals, anything not in the list */}
              {quickOpen ? (
                <form onSubmit={addQuick} className="rounded-xl border border-ink-200 bg-white p-2.5 space-y-2">
                  <div className="flex gap-2">
                    <input value={quick.label} onChange={(e) => setQuick((q) => ({ ...q, label: e.target.value }))} maxLength={40}
                      placeholder={t('composer.quickLabel')} aria-label={t('composer.quickLabel')}
                      className="flex-1 min-w-0 h-9 px-2.5 text-sm rounded-lg border border-ink-300 bg-white outline-none focus:border-door-600" />
                    <input type="number" inputMode="numeric" required min="1" max="5000" value={quick.kcal} onChange={(e) => setQuick((q) => ({ ...q, kcal: e.target.value }))}
                      placeholder="kcal" aria-label="kcal"
                      className="w-20 h-9 px-2 text-sm text-end rounded-lg border border-ink-300 bg-white outline-none focus:border-door-600 tabular-nums" />
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {[['protein_g', 'macro.protein_short'], ['carbs_g', 'macro.carbs_short'], ['fat_g', 'macro.fat_short']].map(([k, label]) => (
                      <label key={k} className="flex items-center gap-1 text-xs text-ink-500">
                        {t(label)}
                        <input type="number" inputMode="numeric" min="0" value={quick[k]} onChange={(e) => setQuick((q) => ({ ...q, [k]: e.target.value }))}
                          placeholder="g" aria-label={`${t(label)} (g)`}
                          className="w-14 h-8 px-1.5 text-sm text-end rounded-md border border-ink-300 bg-white outline-none focus:border-door-600 tabular-nums" />
                      </label>
                    ))}
                    <span className="ms-auto flex gap-2">
                      <button type="button" onClick={() => setQuickOpen(false)} className="text-xs text-ink-500 hover:text-ink-800 px-1">{t('action.cancel')}</button>
                      <button type="submit" className="h-8 px-3 rounded-lg bg-door-600 hover:bg-door-700 text-white text-xs font-semibold">{t('composer.add')}</button>
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-500">{t('composer.quickHint')}</p>
                </form>
              ) : (
                <button type="button" onClick={() => setQuickOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-ink-200 bg-white text-xs font-semibold text-ink-800 hover:bg-ink-100">
                  <Lightning size={14} weight="fill" className="text-saffron-500" aria-hidden="true" />{t('composer.quickAdd')}
                </button>
              )}

              {favorites.length > 0 && (
                <ChipRow icon={Star} label={t('composer.favorites')}>
                  {favorites.map((id) => (
                    <Chip key={id} food={foodDb[id]} sub={amountLabel(foodDb[id], lastAmount(id))} onTap={() => addWithAmount(id, lastAmount(id))} />
                  ))}
                </ChipRow>
              )}

              {recent.length > 0 && (
                <ChipRow icon={ClockCounterClockwise} label={t('composer.recent')}>
                  {recent.map((r) => (
                    <Chip key={r.food_id} food={foodDb[r.food_id]} sub={amountLabel(foodDb[r.food_id], r.amount)} onTap={() => addWithAmount(r.food_id, r.amount)} />
                  ))}
                </ChipRow>
              )}
            </div>
          )}

          {/* Presets */}
          {presets.length > 0 && !search && (
            <div>
              <div className="text-[10px] font-bold text-ink-400 mb-1.5 px-0.5">{t('composer.savedPresets')}</div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map(p => (
                  <div key={p.id} className="inline-flex items-center gap-0.5">
                    <button onClick={() => { onChange(p.items_json); setPickerOpen(false); setSearch(''); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-saffron-50 border border-saffron-200 text-saffron-700 hover:bg-saffron-100 hover:border-saffron-300 transition-all active:scale-95">
                      ⭐ {p.name}
                    </button>
                    {onDeletePreset && (
                      <button onClick={() => onDeletePreset(p.id)}
                        className="w-5 h-5 rounded-lg text-[10px] text-ink-400 hover:text-ink-900 hover:bg-ink-100 flex items-center justify-center transition-colors">×</button>
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
                <p className="text-xs text-ink-400 text-center py-2">{t('composer.noFoodFound')}</p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {filteredFoods.map(f => (
                    <FoodButton key={f.id} food={f} foodDb={foodDb} items={items} onTap={quickAdd} onDelete={f.custom ? onDeleteCustomFood : null} favorite={history.favorites.includes(f.id)} />
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
                <div className="text-[10px] font-bold text-ink-400 mb-1.5 px-0.5">
                  {cat.key === 'custom' ? cat.label : t(`foodCat.${cat.key}`)}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {catFoods.map(f => (
                    <FoodButton key={f.id} food={f} foodDb={foodDb} items={items} onTap={quickAdd} onDelete={f.custom ? onDeleteCustomFood : null} favorite={history.favorites.includes(f.id)} />
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
                  className="w-full py-2.5 border border-dashed border-ink-300 rounded-xl text-sm font-semibold text-ink-500 hover:border-door-400 hover:text-door-600 transition-colors flex items-center justify-center gap-2">
                  <span className="text-lg">+</span> {t('composer.createCustom')}
                </button>
              )}
            </div>
          )}

          <p className="text-[10px] text-ink-400 text-center pt-1">
            {t('composer.tapToAdd')}
          </p>
        </div>
      )}

      {/* Add button when picker is closed */}
      {!disabled && !pickerOpen && !hasItems && (
        <div className="px-3 pb-2.5 pt-0.5 flex gap-2">
          <button onClick={() => setPickerOpen(true)}
            className="flex-1 py-1.5 text-xs font-semibold text-door-600 hover:text-door-800 hover:bg-door-50 rounded-lg transition-colors">
            {t('composer.addFood')}
          </button>
          {yesterdayKcal > 0 && (
            <button onClick={() => onChange(yesterdayItems.map((it) => ({ ...it })))}
              className="flex-1 py-1.5 text-xs font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-100 rounded-lg flex items-center justify-center gap-1.5">
              <ArrowCounterClockwise size={14} aria-hidden="true" />{t('composer.sameAsYesterday', { kcal: yesterdayKcal })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Food button */
function FoodButton({ food, foodDb, items, onTap, onDelete, favorite }) {
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
 ? 'bg-door-50 border border-door-300 shadow-sm'
 : 'bg-white border border-ink-200 hover:border-door-300 hover:shadow-sm'
 }`}
      >
        <span className="text-xl shrink-0">{food.emoji}</span>
        <div className="min-w-0 flex-1 pe-5">
          <div className="text-xs font-bold text-ink-800 truncate">{food.name.split('(')[0].trim()}</div>
          <div className="text-[10px] text-ink-400">{unitLabel} · {Math.round(defaultN.kcal)}{t('composer.kcal')}</div>
        </div>
        {inMeal && (
          <span className="absolute -top-1 -start-1 w-4 h-4 bg-door-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">+</span>
        )}
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); toggleFavorite(food.id); }}
        aria-label={favorite ? t('composer.unfavorite', { name: food.name }) : t('composer.favorite', { name: food.name })} aria-pressed={!!favorite}
        className={`absolute top-1 end-1 w-6 h-6 flex items-center justify-center rounded-md ${favorite ? 'text-saffron-500' : 'text-ink-300 hover:text-ink-500'}`}>
        <Star size={14} weight={favorite ? 'fill' : 'regular'} />
      </button>
      {onDelete && !inMeal && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(food.id); }}
          className="absolute -top-1.5 -start-1.5 w-5 h-5 bg-white border border-ink-300 hover:bg-ink-100 text-ink-600 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors"
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
    <form onSubmit={handleSubmit} className="bg-white border border-door-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-ink-800">{t('customFood.title')}</span>
        <button type="button" onClick={onCancel} className="text-ink-400 hover:text-ink-600 text-sm">✕</button>
      </div>

      {/* Name + Emoji */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-ink-500 mb-1 block">{t('customFood.name')}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder={t('customFood.namePlaceholder')} autoFocus required
            className="w-full text-sm border border-ink-200 rounded-lg px-3 py-2 focus:outline-none focus:border-door-400" />
        </div>
        <div className="w-20">
          <label className="text-[10px] font-bold text-ink-500 mb-1 block">{t('customFood.emoji')}</label>
          <select value={emoji} onChange={e => setEmoji(e.target.value)}
            className="w-full text-xl border border-ink-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-door-400 bg-white text-center">
            {EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Unit */}
      <div>
        <label className="text-[10px] font-bold text-ink-500 mb-1 block">{t('customFood.unit')}</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setUnit('g')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${unit === 'g' ? 'bg-door-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
            {t('customFood.unitGrams')}
          </button>
          <button type="button" onClick={() => setUnit('piece')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${unit === 'piece' ? 'bg-door-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
            {t('customFood.unitPiece')}
          </button>
        </div>
      </div>

      {/* Macros */}
      <div>
        <label className="text-[10px] font-bold text-ink-500 mb-1 block">
          {t('customFood.nutrition', { per: unit === 'g' ? t('customFood.per100g') : t('customFood.perPiece') })}
        </label>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <div className="text-[10px] text-ink-400 mb-0.5 text-center">{t('customFood.kcal')}</div>
            <input type="number" step="0.1" value={kcal} onChange={e => setKcal(e.target.value)}
              placeholder="0" required
              className="w-full text-xs border border-ink-200 rounded-lg px-2 py-1.5 text-center font-bold focus:outline-none focus:border-door-400" />
          </div>
          <div>
            <div className="text-[10px] text-door-700 mb-0.5 text-center">{t('macro.protein')}</div>
            <input type="number" step="0.1" value={protein} onChange={e => setProtein(e.target.value)}
              placeholder="0"
              className="w-full text-xs border border-ink-200 rounded-lg px-2 py-1.5 text-center font-bold focus:outline-none focus:border-clay-400" />
          </div>
          <div>
            <div className="text-[10px] text-saffron-700 mb-0.5 text-center">{t('macro.carbs')}</div>
            <input type="number" step="0.1" value={carbs} onChange={e => setCarbs(e.target.value)}
              placeholder="0"
              className="w-full text-xs border border-ink-200 rounded-lg px-2 py-1.5 text-center font-bold focus:outline-none focus:border-saffron-400" />
          </div>
          <div>
            <div className="text-[10px] text-olive-700 mb-0.5 text-center">{t('macro.fat')}</div>
            <input type="number" step="0.1" value={fat} onChange={e => setFat(e.target.value)}
              placeholder="0"
              className="w-full text-xs border border-ink-200 rounded-lg px-2 py-1.5 text-center font-bold focus:outline-none focus:border-door-400" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={!name.trim() || !kcal || saving}
        className="w-full py-2.5 bg-door-500 hover:bg-door-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-40 active:scale-[0.98]">
        {saving ? t('customFood.creating') : t('customFood.create', { name: name || t('customFood.foodDefault') })}
      </button>
    </form>
  );
}

function ChipRow({ icon: Icon, label, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-500 mb-1.5 px-0.5"><Icon size={13} aria-hidden="true" />{label}</div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5" data-scroll>{children}</div>
    </div>
  );
}

/** One tap = add this food again, in the amount shown. */
function Chip({ food, sub, onTap }) {
  return (
    <button type="button" onClick={onTap}
      className="shrink-0 inline-flex items-center gap-1.5 h-9 ps-2 pe-3 rounded-lg border border-ink-200 bg-white hover:border-door-300 text-start">
      <span aria-hidden="true">{food.emoji}</span>
      <span className="text-xs font-semibold text-ink-800 max-w-[9rem] truncate">{food.name.split('(')[0].trim()}</span>
      <span className="text-[11px] text-ink-500 tabular-nums">{sub}</span>
    </button>
  );
}
