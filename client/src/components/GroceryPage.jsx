import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlass, Plus, Minus, X, Check, Copy, Basket } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { FOOD_CATEGORIES } from '../lib/foods';
import { PageHeader, Panel, EmptyState, TextButton } from './ui/primitives';

const PRICES_TND = {
  eggs:            { price: 0.35, per: 'piece', label: '0.350 DT/egg' },
  bulgur_cooked:   { price: 2.5,  per: 'kg',    label: '2.500 DT/kg' },
  potatoes_boiled: { price: 1.8,  per: 'kg',    label: '1.800 DT/kg' },
  rice_cooked:     { price: 3.2,  per: 'kg',    label: '3.200 DT/kg' },
  slata_mechouia:  { price: 5.0,  per: 'kg',    label: '5.000 DT/kg' },
  cucumber:        { price: 1.5,  per: 'kg',    label: '1.500 DT/kg' },
  yaarout:         { price: 1.2,  per: 'pot',   label: '1.200 DT/pot' },
  tuna_canned:     { price: 4.5,  per: 'can',   label: '4.500 DT/can (160g)' },
  minced_meat:     { price: 28.0, per: 'kg',    label: '28.000 DT/kg' },
  chicken_breast:  { price: 18.0, per: 'kg',    label: '18.000 DT/kg' },
  bread_taaouna:   { price: 0.5,  per: 'piece', label: '0.500 DT/piece (~200g)' },
  bread_white:     { price: 0.39, per: 'piece', label: '0.390 DT/baguette (~250g)' },
  bread_cereal:    { price: 1.5,  per: 'piece', label: '1.500 DT/piece (~300g)' },
  almonds:         { price: 45.0, per: 'kg',    label: '45.000 DT/kg' },
  coca_cola_zero:  { price: 1.8,  per: 'can',   label: '1.800 DT/can (330ml)' },
  strawberries:    { price: 6.0,  per: 'kg',    label: '6.000 DT/kg' },
  peaches:         { price: 4.5,  per: 'kg',    label: '4.500 DT/kg (~4 pieces/kg)' },
};

function estimatePrice(foodId, amount) {
  const p = PRICES_TND[foodId];
  if (!p) return null;
  if (p.per === 'piece' || p.per === 'pot') return p.price * amount;
  if (p.per === 'can') return p.price * Math.ceil(amount / (foodId === 'tuna_canned' ? 160 : 330));
  if (p.per === 'kg') return p.price * (amount / 1000);
  return null;
}

const CART_KEY = 'grocery_cart';
const loadCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch { return {}; } };
const CATEGORY_KEYS = [...FOOD_CATEGORIES.map((c) => c.key), 'custom'];
const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function GroceryPage() {
  const { t } = useTranslation();
  const [foods, setFoods] = useState({});
  const [cart, setCart] = useState(loadCart);
  const [loading, setLoading] = useState(true);
  const [suggestion, setSuggestion] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getFoods();
        setFoods(data.foods || {});
        api.getGroceryList(7).then(setSuggestion).catch(() => {});
      } catch (err) {
        console.error('Failed to load foods:', err);
      }
      setLoading(false);
    })();
  }, []);

  // The list survives a reload (per-device convenience; never required for correctness).
  useEffect(() => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {} }, [cart]);

  const idOf = (f) => f.id || f.food_id;
  const catLabel = (key) => t(`foodCat.${key}`);
  const formatAmount = (food, amount) => (food.unit === 'g'
    ? (amount >= 1000 ? `${(amount / 1000).toFixed(1)} kg` : `${amount} g`)
    : `${amount} ${food.unit}${amount > 1 ? 's' : ''}`);
  const step = (food) => (food.unit === 'g' ? 50 : 1);

  const toggle = (id) => setCart((prev) => {
    if (prev[id]) { const next = { ...prev }; delete next[id]; return next; }
    return { ...prev, [id]: { amount: (foods[id]?.default_amount || 100) * 7, checked: false } };
  });
  const setAmount = (id, amount) => setCart((prev) => ({ ...prev, [id]: { ...prev[id], amount: Math.max(0, amount) } }));
  const setChecked = (id) => setCart((prev) => ({ ...prev, [id]: { ...prev[id], checked: !prev[id].checked } }));

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return Object.values(foods)
      .filter((f) => category === 'all' || (f.category || 'custom') === category)
      .filter((f) => !q || normalize(`${f.name} ${f.nameAr || ''}`).includes(q));
  }, [foods, query, category]);

  const items = Object.entries(cart).map(([id, v]) => (foods[id] ? { id, food: foods[id], ...v, price: estimatePrice(id, v.amount) } : null)).filter(Boolean);
  const total = items.reduce((s, i) => s + (i.price || 0), 0);
  const checkedCount = items.filter((i) => i.checked).length;

  function loadSuggestion() {
    if (!suggestion?.grocery_list) return;
    setCart(Object.fromEntries(suggestion.grocery_list.map((it) => [it.food_id, { amount: it.amount, checked: false }])));
  }

  async function copyList() {
    const lines = [t('grocery.copyHeader'), ''];
    for (const key of CATEGORY_KEYS) {
      const group = items.filter((i) => (i.food.category || 'custom') === key);
      if (!group.length) continue;
      lines.push(catLabel(key));
      group.forEach((i) => lines.push(`  ${i.checked ? '✓' : '○'} ${i.food.name} — ${formatAmount(i.food, i.amount)}${i.price != null ? ` (~${i.price.toFixed(3)} DT)` : ''}`));
      lines.push('');
    }
    lines.push(t('grocery.copyTotal', { cost: total.toFixed(3) }));
    try { await navigator.clipboard.writeText(lines.join('\n')); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }

  if (loading) return <p className="text-center py-12 text-sm text-ink-500" role="status">{t('app.loading')}</p>;

  const list = (
    <Panel
      title={t('grocery.yourList')}
      action={items.length > 0 && <span className="text-sm text-ink-500 tabular-nums">{checkedCount}/{items.length} {t('grocery.checked')}</span>}
      bodyClassName="px-5 sm:px-6 pb-5 pt-3"
      className="xl:sticky xl:top-6"
    >
      {items.length === 0 ? (
        <EmptyState
          icon={Basket}
          title={t('grocery.empty')}
          text={suggestion?.grocery_list?.length ? t('grocery.emptyHint') : undefined}
          action={suggestion?.grocery_list?.length > 0 && (
            <button type="button" onClick={loadSuggestion} className="h-10 px-4 rounded-lg bg-door-600 hover:bg-door-700 text-white text-sm font-semibold">
              {t('grocery.loadFromPatterns')}
            </button>
          )}
        />
      ) : (
        <>
          <ul className="divide-y divide-ink-200 -mx-1">
            {items.map(({ id, food, amount, checked, price }) => (
              <li key={id} className="flex items-center gap-3 py-2.5 px-1">
                <button type="button" onClick={() => setChecked(id)} role="checkbox" aria-checked={checked} aria-label={food.name}
                  className={`w-6 h-6 shrink-0 rounded-md border flex items-center justify-center ${checked ? 'bg-olive-600 border-olive-600 text-white' : 'border-ink-300 bg-white'}`}>
                  {checked && <Check size={14} weight="bold" />}
                </button>
                <div className={`flex-1 min-w-0 ${checked ? 'line-through text-ink-400' : 'text-ink-900'}`}>
                  <div className="text-sm truncate">{food.name}</div>
                  {price != null && <div className="text-xs text-ink-500 tabular-nums no-underline">~{price.toFixed(3)} DT</div>}
                </div>
                <div className="flex items-center shrink-0 border border-ink-200 rounded-lg">
                  <button type="button" onClick={() => setAmount(id, amount - step(food))} aria-label={t('grocery.less', { name: food.name })} className="w-8 h-8 flex items-center justify-center text-ink-600 hover:bg-ink-100 rounded-s-lg"><Minus size={14} /></button>
                  <span className="w-16 text-center text-xs font-semibold text-ink-900 tabular-nums">{formatAmount(food, amount)}</span>
                  <button type="button" onClick={() => setAmount(id, amount + step(food))} aria-label={t('grocery.more', { name: food.name })} className="w-8 h-8 flex items-center justify-center text-ink-600 hover:bg-ink-100 rounded-e-lg"><Plus size={14} /></button>
                </div>
                <button type="button" onClick={() => toggle(id)} aria-label={t('grocery.remove', { name: food.name })} className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-900 hover:bg-ink-100"><X size={16} /></button>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-ink-200 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs text-ink-500">{t('grocery.estimatedTotal')}</div>
              <div className="font-display text-2xl font-semibold text-ink-900 tabular-nums">{total.toFixed(3)} <span className="text-sm font-sans text-ink-500">DT</span></div>
            </div>
            <div className="flex items-center gap-4">
              <TextButton onClick={() => setCart({})}>{t('grocery.clearAll')}</TextButton>
              <button type="button" onClick={copyList} className="h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm font-semibold text-ink-800 hover:bg-ink-100 flex items-center gap-2 whitespace-nowrap">
                {copied ? <Check size={16} weight="bold" className="text-olive-600" /> : <Copy size={16} />}
                {copied ? t('grocery.copied') : t('grocery.copyList')}
              </button>
            </div>
          </div>
          <p className="text-xs text-ink-500 mt-3">{t('grocery.priceDisclaimer')}</p>
        </>
      )}
    </Panel>
  );

  return (
    <div>
      <PageHeader title={t('grocery.title')} subtitle={t('grocery.subtitle')}
        actions={suggestion?.grocery_list?.length > 0 && items.length > 0 && <TextButton onClick={loadSuggestion}>{t('grocery.loadFromPatterns')}</TextButton>} />

      <div className="grid xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="xl:order-2 min-w-0">{list}</div>

        <Panel title={t('grocery.addItems')} bodyClassName="p-5 sm:p-6 pt-4" className="xl:order-1 min-w-0">
          <label className="relative block">
            <span className="sr-only">{t('grocery.search')}</span>
            <MagnifyingGlass size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('grocery.search')}
              enterKeyHint="search"
              className="w-full h-11 ps-10 pe-3 rounded-lg border border-ink-300 bg-white text-ink-900 placeholder:text-ink-400 outline-none focus:border-door-600 focus:ring-2 focus:ring-door-200" />
          </label>

          <div className="flex gap-2 overflow-x-auto mt-3 pb-1 -mx-1 px-1" role="radiogroup" aria-label={t('grocery.categories')}>
            {['all', ...CATEGORY_KEYS].map((key) => (
              <button key={key} type="button" role="radio" aria-checked={category === key} onClick={() => setCategory(key)}
                className={`h-8 px-3 shrink-0 rounded-md text-sm border ${category === key ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-100'}`}>
                {key === 'all' ? t('grocery.allCategories') : catLabel(key)}
              </button>
            ))}
          </div>

          <ul className="mt-3 divide-y divide-ink-200 max-h-[60vh] overflow-y-auto -mx-1" data-scroll>
            {results.map((food) => {
              const id = idOf(food);
              const inList = !!cart[id];
              return (
                <li key={id}>
                  <button type="button" onClick={() => toggle(id)} aria-pressed={inList}
                    className="w-full flex items-center gap-3 px-1 py-2.5 text-start hover:bg-ink-50">
                    <span aria-hidden="true" className="w-6 text-center">{food.emoji}</span>
                    <span className="flex-1 min-w-0 text-sm text-ink-900 truncate">{food.name}</span>
                    {PRICES_TND[id] && <span className="hidden sm:inline text-xs text-ink-500">{PRICES_TND[id].label}</span>}
                    <span className={`w-7 h-7 shrink-0 rounded-md flex items-center justify-center ${inList ? 'bg-olive-600 text-white' : 'border border-ink-300 text-ink-600'}`}>
                      {inList ? <Check size={14} weight="bold" /> : <Plus size={14} />}
                    </span>
                  </button>
                </li>
              );
            })}
            {results.length === 0 && <li className="py-6 text-center text-sm text-ink-500">{t('grocery.noResults')}</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
