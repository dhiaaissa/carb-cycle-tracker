import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { formatNumber } from '../lib/format';
import { planForProgramme, goalSettingsFor } from '../../../shared/dayTargets.js';
import {
  ACTIVITY_LEVELS, GOALS, GOAL_RATES, MACRO_PRESETS, KCAL_PER_KG,
  validateProfile, lbToKg, kgToLb, ftInToCm, cmToFtIn,
} from '../../../shared/nutrition.js';

const PROGRAMMES = [
  { id: 'carb_cycle', color: 'bg-indigo-500' },
  { id: 'weight_loss', color: 'bg-sky-500' },
  { id: 'muscle_gain', color: 'bg-violet-500' },
  { id: 'recomp', color: 'bg-emerald-500' },
];

const PROGRAMME_NAME_KEY = {
  carb_cycle: 'programme.carb_cycle',
  weight_loss: 'programme.weight_loss',
  muscle_gain: 'programme.muscle_gain',
  recomp: 'programme.body_recomp',
};

const STEPS = ['programme', 'about', 'activity', 'plan'];

const num = (v) => (v === '' || v == null ? undefined : Number(v));
const round1 = (v) => Math.round(v * 10) / 10;

/** Accessible single-choice group: real radio inputs, styled as cards. */
function Choice({ legend, options, value, onChange, columns = 'grid-cols-2', hideLegend = false }) {
  return (
    <fieldset>
      <legend className={hideLegend ? 'sr-only' : 'block text-sm font-semibold text-gray-700 mb-1.5'}>{legend}</legend>
      <div className={`grid ${columns} gap-2`}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label key={o.value}
              className={`relative cursor-pointer rounded-xl border px-3 py-2.5 transition-colors focus-within:ring-2 focus-within:ring-indigo-400 ${
 checked ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
              <input type="radio" className="sr-only" checked={checked} onChange={() => onChange(o.value)} />
              <span className={`block font-bold text-sm ${checked ? 'text-indigo-700' : 'text-gray-800'}`}>{o.label}</span>
              {o.detail && <span className="block text-xs text-gray-500 mt-0.5">{o.detail}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Field({ id, label, hint, error, suffix, ...input }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input id={id} type="number" inputMode="decimal"
          aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={`w-full px-3 py-2.5 border rounded-xl bg-white text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 ${suffix ? 'pe-10' : ''} ${error ? 'border-amber-500' : 'border-gray-200'}`}
          {...input} />
        {suffix && <span className="absolute inset-y-0 end-3 flex items-center text-xs text-gray-400 pointer-events-none">{suffix}</span>}
      </div>
      {error ? <p id={`${id}-err`} className="text-xs text-amber-700 mt-1">{error}</p>
        : hint ? <p id={`${id}-hint`} className="text-xs text-gray-500 mt-1">{hint}</p> : null}
    </div>
  );
}

export default function ProgrammeSetup({ onDone, onSkip, initialProgramme = null }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [programme, setProgramme] = useState(initialProgramme);

  const [units, setUnits] = useState('metric');
  const [sex, setSex] = useState('male');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState('');         // in the selected unit
  const [goalWeight, setGoalWeight] = useState(''); // in the selected unit
  const [bodyFat, setBodyFat] = useState('');
  const [activity, setActivity] = useState('moderate');

  const [goal, setGoal] = useState(null);   // null = programme default
  const [rate, setRate] = useState(null);
  const [preset, setPreset] = useState(null);

  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Re-running setup from Settings: start from what's saved.
  useEffect(() => {
    api.getMyProgramme().then((me) => {
      if (!me?.sex) return;
      const imperial = me.units === 'imperial';
      setUnits(me.units || 'metric');
      setSex(me.sex);
      if (me.age) setAge(String(me.age));
      if (me.height_cm) {
        setHeightCm(String(Math.round(me.height_cm)));
        const fi = cmToFtIn(me.height_cm);
        setHeightFt(String(fi.ft)); setHeightIn(String(Math.round(fi.in)));
      }
      const toUnit = (kg) => (kg ? String(round1(imperial ? kgToLb(kg) : kg)) : '');
      setWeight(toUnit(me.current_weight_kg));
      setGoalWeight(toUnit(me.goal_weight_kg));
      if (me.body_fat_pct) setBodyFat(String(me.body_fat_pct));
      if (me.activity_level) setActivity(me.activity_level);
      if (me.goal) setGoal(me.goal);
      if (me.goal_rate_kg_week != null) setRate(me.goal_rate_kg_week);
      if (me.macro_preset) setPreset(me.macro_preset);
    }).catch(() => {});
  }, []);

  function switchUnits(next) {
    if (next === units) return;
    const conv = next === 'imperial' ? kgToLb : lbToKg;
    if (weight) setWeight(String(round1(conv(Number(weight)))));
    if (goalWeight) setGoalWeight(String(round1(conv(Number(goalWeight)))));
    if (next === 'imperial' && heightCm) {
      const fi = cmToFtIn(Number(heightCm));
      setHeightFt(String(fi.ft)); setHeightIn(String(Math.round(fi.in)));
    }
    if (next === 'metric' && heightFt) setHeightCm(String(Math.round(ftInToCm(Number(heightFt), Number(heightIn) || 0))));
    setUnits(next);
  }

  const toKg = (v) => (v === '' ? undefined : units === 'imperial' ? lbToKg(Number(v)) : Number(v));
  const profile = {
    sex,
    age: num(age),
    heightCm: units === 'imperial'
      ? (heightFt === '' ? undefined : ftInToCm(Number(heightFt), Number(heightIn) || 0))
      : num(heightCm),
    weightKg: toKg(weight),
    activity,
    bodyFatPct: num(bodyFat),
  };
  const errors = validateProfile(profile);
  const fieldError = (code) => (showErrors && errors.includes(code) ? t(`setup.err.${code}`) : undefined);

  const defaults = goalSettingsFor(programme || 'weight_loss');
  const goalSettings = goalSettingsFor(programme || 'weight_loss', {
    goal: goal ?? undefined, goal_rate_kg_week: rate ?? undefined, macro_preset: preset ?? undefined,
  });
  const isCycle = programme === 'carb_cycle';

  const profileKey = JSON.stringify(profile);
  const goalKey = JSON.stringify(goalSettings);
  const plan = useMemo(
    () => (errors.length ? null : planForProgramme(programme, profile, goalSettings)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programme, profileKey, goalKey],
  );

  function next() {
    if (STEPS[step] === 'about' && errors.length) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setError('');
    setSubmitting(true);
    try {
      await api.setupProgramme({
        programme,
        units,
        sex,
        age: profile.age,
        height_cm: round1(profile.heightCm),
        weight_kg: round1(profile.weightKg),
        body_fat_pct: profile.bodyFatPct ?? null,
        activity_level: activity,
        goal_weight_kg: goalWeight ? round1(toKg(goalWeight)) : null,
        goal,                                          // null → programme default
        goal_rate_kg_week: goal === 'maintain' ? 0 : rate,
        macro_preset: preset,
      });
      onDone();
    } catch (err) {
      setError(err.message || t('setup.error.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  const stepKey = STEPS[step];
  const rateLabel = (r) => (units === 'imperial'
    ? t('setup.rate.lb', { rate: round1(kgToLb(r)) })
    : t('setup.rate.kg', { rate: r }));

  return (
    <div className="theme-fixed min-h-screen-safe bg-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <ol className="flex items-center justify-center gap-2 mb-5" aria-label={t('setup.progress')}>
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? 'step' : undefined}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-10 bg-indigo-200' : i < step ? 'w-6 bg-indigo-300/70' : 'w-6 bg-indigo-300/25'}`}>
              <span className="sr-only">{t('setup.stepOf', { n: i + 1, total: STEPS.length })}</span>
            </li>
          ))}
        </ol>

        <div className="text-center mb-6">
          <div className="text-sm text-door-200 mb-2">{t('setup.stepOf', { n: step + 1, total: STEPS.length })}</div>
          <h1 className="text-2xl font-bold text-white mb-1">{t(`setup.${stepKey}.title`)}</h1>
          <p className="text-indigo-200 text-sm">{t(`setup.${stepKey}.subtitle`)}</p>
        </div>

        <div className="theme-auto bg-white rounded-2xl p-6 sm:p-8">
          {stepKey === 'programme' && (
            <fieldset>
              <legend className="sr-only">{t('setup.programme.title')}</legend>
              <div className="grid sm:grid-cols-2 gap-3">
                {PROGRAMMES.map((p) => {
                  const checked = programme === p.id;
                  return (
                    <label key={p.id}
                      className={`cursor-pointer text-start p-4 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-indigo-400 ${checked ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                      <input type="radio" name="programme" className="sr-only" checked={checked} onChange={() => setProgramme(p.id)} />
                      <span aria-hidden="true" className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${p.color} text-2xl mb-2`}></span>
                      <span className="block font-bold text-gray-800">{t(PROGRAMME_NAME_KEY[p.id])}</span>
                      <span className="block text-xs text-gray-500 mt-1 leading-relaxed">{t(`setup.programme.${p.id}.desc`)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {stepKey === 'about' && (
            <div className="space-y-4">
              <Choice legend={t('setup.units.label')} value={units} onChange={switchUnits}
                options={[{ value: 'metric', label: t('setup.units.metric') }, { value: 'imperial', label: t('setup.units.imperial') }]} />
              <Choice legend={t('setup.sex')} value={sex} onChange={setSex}
                options={[{ value: 'male', label: t('setup.sex.male') }, { value: 'female', label: t('setup.sex.female') }]} />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field id="age" label={t('setup.age')} value={age} onChange={(e) => setAge(e.target.value)}
                  placeholder="30" min={13} max={100} error={fieldError('age')} />
                {units === 'metric' ? (
                  <Field id="height" label={t('setup.height')} suffix="cm" value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)} placeholder="175" error={fieldError('height')} />
                ) : (
                  <fieldset>
                    <legend className="block text-sm font-semibold text-gray-700 mb-1">{t('setup.height')}</legend>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Field id="height-ft" label={<span className="sr-only">{t('setup.ft')}</span>} suffix="ft" value={heightFt}
                        onChange={(e) => setHeightFt(e.target.value)} placeholder="5" />
                      <Field id="height-in" label={<span className="sr-only">{t('setup.in')}</span>} suffix="in" value={heightIn}
                        onChange={(e) => setHeightIn(e.target.value)} placeholder="9" />
                    </div>
                    {fieldError('height') && <p className="text-xs text-amber-700 mt-1">{fieldError('height')}</p>}
                  </fieldset>
                )}
                <Field id="weight" label={t('setup.weight')} suffix={units === 'imperial' ? 'lb' : 'kg'} step="0.1"
                  value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={units === 'imperial' ? '165' : '75'}
                  error={fieldError('weight')} />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field id="goal-weight" label={t('setup.goalWeightLabel')} suffix={units === 'imperial' ? 'lb' : 'kg'} step="0.1"
                  value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} hint={t('setup.optional')} />
                <Field id="body-fat" label={t('setup.bodyFat')} suffix="%" step="0.5" value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)} hint={t('setup.bodyFatHint')} error={fieldError('bodyFat')} />
              </div>
            </div>
          )}

          {stepKey === 'activity' && (
            <Choice legend={t('setup.activity')} hideLegend value={activity} onChange={setActivity} columns="grid-cols-1"
              options={Object.keys(ACTIVITY_LEVELS).map((a) => ({
                value: a, label: t(`setup.activity.${a}`), detail: t(`setup.activity.${a}Detail`),
              }))} />
          )}

          {stepKey === 'plan' && (
            <div className="space-y-5">
              {!isCycle && (
                <>
                  <Choice legend={t('setup.goal.label')} value={goalSettings.goal} columns="grid-cols-3"
                    onChange={(g) => { setGoal(g); setRate(g === defaults.goal ? defaults.rateKgPerWeek : null); }}
                    options={GOALS.map((g) => ({ value: g, label: t(`setup.goal.${g}`) }))} />
                  {goalSettings.goal !== 'maintain' && (
                    <Choice legend={t('setup.rate.label')} value={goalSettings.rateKgPerWeek} onChange={setRate}
                      columns={GOAL_RATES[goalSettings.goal].length > 3 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}
                      options={GOAL_RATES[goalSettings.goal].map((r) => ({
                        value: r,
                        label: rateLabel(r),
                        detail: t(`setup.rate.${goalSettings.goal}_${String(r).replace('.', '_')}`, {
                          kcal: formatNumber(Math.round((r * KCAL_PER_KG) / 7)),
                        }),
                      }))} />
                  )}
                </>
              )}
              <Choice legend={t('setup.preset.label')} value={goalSettings.preset} onChange={setPreset} columns="grid-cols-1 sm:grid-cols-3"
                options={Object.keys(MACRO_PRESETS).map((p) => ({ value: p, label: t(`setup.preset.${p}`), detail: t(`setup.preset.${p}Detail`) }))} />

              {plan?.ok && (
                <section aria-live="polite" className="rounded-2xl bg-indigo-50 border border-indigo-100 p-5">
                  {isCycle ? (
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                      {['low', 'med', 'high'].map((type) => (
                        <div key={type} className="text-center bg-white rounded-xl p-3 border border-indigo-100">
                          <div className="text-[11px] font-bold text-indigo-600">{t(`dayType.${type}Short`)}</div>
                          <div className="text-xl sm:text-2xl font-extrabold text-gray-800 my-0.5 tabular-nums">{formatNumber(plan.dayTargets[type].calories)}</div>
                          <dl className="text-[11px] text-gray-600 tabular-nums leading-snug">
                            {[['protein', 'protein_g'], ['carbs', 'carbs_g'], ['fat', 'fat_g']].map(([m, k]) => (
                              <div key={m} className="flex justify-center gap-1">
                                <dt>{t(`macro.${m}_short`)}</dt><dd>{plan.dayTargets[type][k]}g</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center mb-4">
                      <div className="text-xs font-bold text-indigo-600">{t('setup.dailyCalorieTarget')}</div>
                      <div className="text-5xl font-extrabold text-gray-800 my-1 tabular-nums">{formatNumber(plan.calories)}</div>
                      <div className="text-sm text-gray-600">{t('setup.macroLine', { p: plan.protein_g, c: plan.carbs_g, f: plan.fat_g })}</div>
                    </div>
                  )}

                  <h2 className="text-sm font-bold text-gray-800 mb-1.5">{t('setup.plan.howTitle')}</h2>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc ps-5">
                    <li>{t('setup.plan.tdeeLine', {
                      tdee: formatNumber(plan.tdee), bmr: formatNumber(plan.bmr),
                      method: t(`setup.method.${plan.bmrMethod}`), factor: ACTIVITY_LEVELS[activity].factor,
                    })}</li>
                    <li>{isCycle
                      ? t('setup.plan.cycleLine')
                      : t(`setup.plan.${goalSettings.goal}Line`, { rate: rateLabel(plan.effectiveRate), delta: formatNumber(Math.abs(plan.dailyDelta)) })}</li>
                    <li>{t(`setup.plan.macro_${goalSettings.preset}`)}</li>
                  </ul>

                  {plan.warnings.length > 0 && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-3 space-y-1" role="status">
                      {plan.warnings.map((w) => (
                        <p key={w.code}>{t(`setup.warning.${w.code}`, { ...w, applied: w.applied != null ? rateLabel(w.applied) : undefined })}</p>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-3">{t('setup.plan.adjustHint')}</p>
                </section>
              )}
            </div>
          )}

          {error && <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3 mt-4" role="alert">{error}</div>}

          <div className="flex gap-2 mt-6">
            {step === 0
              ? onSkip && <button type="button" onClick={onSkip} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">{t('setup.skip')}</button>
              : <button type="button" onClick={() => setStep((s) => s - 1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">{t('setup.back')}</button>}
            {stepKey === 'plan' ? (
              <button type="button" onClick={handleSubmit} disabled={submitting || !plan?.ok}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold">
                {submitting ? t('setup.savingDots') : t('setup.startTracking')}
              </button>
            ) : (
              <button type="button" onClick={next} disabled={!programme}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold">
                {t('setup.continue')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
