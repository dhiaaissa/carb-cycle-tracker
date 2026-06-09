import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

const PROGRAMMES = [
  { id: 'carb_cycle',  emoji: '🔄', color: 'from-indigo-500 to-purple-600' },
  { id: 'weight_loss', emoji: '📉', color: 'from-red-500 to-rose-600' },
  { id: 'muscle_gain', emoji: '💪', color: 'from-blue-500 to-indigo-600' },
  { id: 'recomp',      emoji: '⚖️', color: 'from-emerald-500 to-teal-600' },
];

// Map programme id → translation key suffix
const PROGRAMME_NAME_KEY = {
  carb_cycle: 'programme.carb_cycle',
  weight_loss: 'programme.weight_loss',
  muscle_gain: 'programme.muscle_gain',
  recomp: 'programme.body_recomp',
};

const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'very', 'extreme'];

export default function ProgrammeSetup({ onDone, onSkip, initialProgramme = null }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [programme, setProgramme] = useState(initialProgramme);
  const [sex, setSex] = useState('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [activity, setActivity] = useState('moderate');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);

  const needsCalc = programme && programme !== 'carb_cycle';

  function computePreview() {
    const w = parseFloat(weight), h = parseFloat(height), a = parseInt(age, 10);
    if (!w || !h || !a) return null;
    const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, extreme: 1.9 };
    const base = (10 * w) + (6.25 * h) - (5 * a);
    const bmr = sex === 'male' ? base + 5 : base - 161;
    const tdee = bmr * factors[activity];
    const adjMap = { weight_loss: -500, muscle_gain: 300, recomp: -200 };
    const macroMap = {
      weight_loss: { p: 0.32, f: 0.28, c: 0.40, ppk: 2.0 },
      muscle_gain: { p: 0.28, f: 0.22, c: 0.50, ppk: 1.8 },
      recomp:      { p: 0.32, f: 0.28, c: 0.40, ppk: 2.0 },
    };
    const adj = adjMap[programme] ?? 0;
    const macros = macroMap[programme];
    let cals = tdee + adj;
    if (cals < bmr) cals = bmr;
    const proteinG = Math.max(macros.ppk * w, (cals * macros.p) / 4);
    const remCals = cals - proteinG * 4;
    const fatRatio = macros.f / (macros.f + macros.c);
    const fatG = (remCals * fatRatio) / 9;
    const carbsG = (remCals * (1 - fatRatio)) / 4;
    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calories: Math.round(cals),
      protein: Math.round(proteinG),
      fat: Math.round(fatG),
      carbs: Math.round(carbsG),
    };
  }

  async function handleSubmit() {
    setError('');
    setSubmitting(true);
    try {
      const payload = { programme };
      if (needsCalc) {
        Object.assign(payload, {
          sex,
          age: parseInt(age, 10),
          height_cm: parseFloat(height),
          weight_kg: parseFloat(weight),
          activity_level: activity,
          goal_weight_kg: goalWeight ? parseFloat(goalWeight) : null,
        });
      }
      await api.setupProgramme(payload);
      onDone();
    } catch (err) {
      setError(err.message || t('setup.error.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  function nextFromStats() {
    if (!weight || !height || !age) {
      setError(t('setup.error.fillStats'));
      return;
    }
    setError('');
    setPreview(computePreview());
    setStep(3);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">{step === 1 ? '🎯' : step === 2 ? '📊' : '✨'}</div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {step === 1 && t('setup.step1.title')}
            {step === 2 && t('setup.step2.title')}
            {step === 3 && t('setup.step3.title')}
          </h1>
          <p className="text-indigo-200 text-sm">
            {step === 1 && t('setup.step1.subtitle')}
            {step === 2 && t('setup.step2.subtitle')}
            {step === 3 && t('setup.step3.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          {step === 1 && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                {PROGRAMMES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setProgramme(p.id)}
                    className={`text-start p-4 rounded-xl border-2 transition-all ${programme === p.id ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                  >
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} text-2xl mb-2`}>
                      {p.emoji}
                    </div>
                    <div className="font-bold text-gray-800">{t(PROGRAMME_NAME_KEY[p.id])}</div>
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">{t(`setup.programme.${p.id}.desc`)}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-6">
                {onSkip && (
                  <button onClick={onSkip} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">
                    {t('setup.skip')}
                  </button>
                )}
                <button
                  disabled={!programme}
                  onClick={() => {
                    if (programme === 'carb_cycle') handleSubmit();
                    else setStep(2);
                  }}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold transition shadow-lg shadow-indigo-500/30"
                >
                  {programme === 'carb_cycle' ? t('setup.useCarbCycle') : t('setup.continue')}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('setup.sex')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['male', 'female'].map(s => (
                      <button
                        key={s}
                        onClick={() => setSex(s)}
                        className={`py-2.5 rounded-xl border-2 font-bold transition ${sex === s ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                        {t(`setup.sex.${s}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('setup.age')}</label>
                    <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="30" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('setup.heightCm')}</label>
                    <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="175" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('setup.weightKg')}</label>
                    <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="75" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('setup.goalWeight')} <span className="text-gray-400 font-normal">{t('setup.goalWeightOptional')}</span></label>
                  <input type="number" step="0.1" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} placeholder="70" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('setup.activity')}</label>
                  <div className="space-y-1.5">
                    {ACTIVITY_LEVELS.map(a => (
                      <button
                        key={a}
                        onClick={() => setActivity(a)}
                        className={`w-full text-start px-4 py-2.5 rounded-xl border-2 transition ${activity === a ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className={`font-bold text-sm ${activity === a ? 'text-indigo-700' : 'text-gray-700'}`}>{t(`setup.activity.${a}`)}</div>
                        <div className="text-xs text-gray-500">{t(`setup.activity.${a}Detail`)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mt-4">{error}</div>}

              <div className="flex gap-2 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">{t('setup.back')}</button>
                <button onClick={nextFromStats} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30">{t('setup.calculate')}</button>
              </div>
            </>
          )}

          {step === 3 && preview && (
            <>
              <div className="space-y-4">
                <div className="text-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-100">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{t('setup.dailyCalorieTarget')}</div>
                  <div className="text-5xl font-extrabold text-gray-800 my-2">{preview.calories}</div>
                  <div className="text-sm text-gray-500">{t('setup.kcalPerDay')}</div>
                  <div className="text-xs text-gray-400 mt-3">{t('setup.bmrTdee', { bmr: preview.bmr, tdee: preview.tdee })}</div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                    <div className="text-xs font-bold text-red-600">{t('setup.proteinUpper')}</div>
                    <div className="text-2xl font-bold text-gray-800 mt-1">{preview.protein}<span className="text-sm text-gray-500">g</span></div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                    <div className="text-xs font-bold text-amber-600">{t('setup.carbsUpper')}</div>
                    <div className="text-2xl font-bold text-gray-800 mt-1">{preview.carbs}<span className="text-sm text-gray-500">g</span></div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                    <div className="text-xs font-bold text-blue-600">{t('setup.fatUpper')}</div>
                    <div className="text-2xl font-bold text-gray-800 mt-1">{preview.fat}<span className="text-sm text-gray-500">g</span></div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  {t('setup.estimateDisclaimer')}
                </p>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mt-4">{error}</div>}

              <div className="flex gap-2 mt-6">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">{t('setup.back')}</button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-lg shadow-indigo-500/30">
                  {submitting ? t('setup.savingDots') : t('setup.startTracking')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
