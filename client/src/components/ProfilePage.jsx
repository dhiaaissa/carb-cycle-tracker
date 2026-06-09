import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';

const PROGRAMME_EMOJI = {
  carb_cycle: '🔄', weight_loss: '📉', muscle_gain: '💪', recomp: '⚖️',
};

export default function ProfilePage({ onEditProgramme }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password form state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getProfile()
      .then(p => { if (!cancelled) { setProfile(p); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPw.length < 6) { setPwError(t('profile.password.tooShort')); return; }
    if (newPw !== confirmPw) { setPwError(t('profile.password.mismatch')); return; }
    setSubmitting(true);
    try {
      await api.changePassword(currentPw, newPw);
      setPwSuccess(t('profile.password.success'));
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwError(err.message || t('auth.error.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!profile) return <div className="text-gray-500">{t('auth.error.generic')}</div>;

  const initial = (profile.username || '?').charAt(0).toUpperCase();
  const memberSince = profile.created_at ? formatDate(profile.created_at, { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const isCarb = profile.programme === 'carb_cycle';

  const fmtVal = (val, fmtKey, params) => (val == null || val === '') ? t('profile.notSet') : t(fmtKey, params);

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto">
      {/* Header card */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-purple-700 rounded-3xl shadow-xl p-6 mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-4xl font-extrabold shadow-lg shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold truncate">@{profile.username}</h1>
              {profile.is_owner && (
                <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">⭐ {t('profile.ownerBadge')}</span>
              )}
            </div>
            {memberSince && <p className="text-indigo-100/80 text-sm mt-0.5">{t('profile.memberSince', { date: memberSince })}</p>}
          </div>
        </div>
      </div>

      {/* Account */}
      <Section title={t('profile.section.account')} icon="👤">
        <Row label={t('profile.field.username')} value={`@${profile.username}`} />
        <Row label={t('profile.field.programme')} value={`${PROGRAMME_EMOJI[profile.programme] || ''} ${t('programme.' + (profile.programme === 'recomp' ? 'body_recomp' : profile.programme))}`} />
        {profile.start_date && <Row label={t('profile.field.startDate')} value={formatDate(profile.start_date + 'T12:00:00', { year: 'numeric', month: 'short', day: 'numeric' })} />}
        <Row label={t('profile.field.daysLogged')} value={String(profile.days_logged)} last />
      </Section>

      {/* Body & programme */}
      <Section title={t('profile.section.body')} icon="🏋️">
        <Row label={t('profile.field.sex')} value={profile.sex ? t('profile.sex.' + profile.sex) : t('profile.notSet')} />
        <Row label={t('profile.field.age')} value={fmtVal(profile.age, 'profile.years', { age: profile.age })} />
        <Row label={t('profile.field.height')} value={fmtVal(profile.height_cm, 'profile.cm', { value: profile.height_cm })} />
        <Row label={t('profile.field.activity')} value={profile.activity_level ? t('profile.activity.' + profile.activity_level) : t('profile.notSet')} />
        <Row label={t('profile.field.currentWeight')} value={fmtVal(profile.current_weight_kg, 'profile.kg', { value: profile.current_weight_kg })} />
        <Row label={t('profile.field.goalWeight')} value={fmtVal(profile.goal_weight_kg, 'profile.kg', { value: profile.goal_weight_kg })} last />
        {onEditProgramme && (
          <button
            onClick={onEditProgramme}
            className="mt-4 w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm transition-colors"
          >
            {t('profile.editProgramme')}
          </button>
        )}
      </Section>

      {/* Targets (only for calculator programmes) */}
      {!isCarb && profile.calorie_target != null && (
        <Section title={t('profile.section.targets')} icon="🎯">
          <Row label={t('macro.calories')} value={t('profile.kcal', { value: profile.calorie_target })} />
          <Row label={t('macro.protein')} value={t('profile.grams', { value: profile.protein_g_target })} />
          <Row label={t('macro.carbs')} value={t('profile.grams', { value: profile.carbs_g_target })} />
          <Row label={t('macro.fat')} value={t('profile.grams', { value: profile.fat_g_target })} last />
        </Section>
      )}

      {/* Change password */}
      <Section title={t('profile.section.password')} icon="🔒">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <PwField
            label={t('profile.password.current')}
            value={currentPw} onChange={setCurrentPw}
            placeholder={t('profile.password.currentPlaceholder')}
            autoComplete="current-password" show={showPw} type={showPw ? 'text' : 'password'}
          />
          <PwField
            label={t('profile.password.new')}
            value={newPw} onChange={setNewPw}
            placeholder={t('profile.password.newPlaceholder')}
            autoComplete="new-password" show={showPw} type={showPw ? 'text' : 'password'}
          />
          <PwField
            label={t('profile.password.confirm')}
            value={confirmPw} onChange={setConfirmPw}
            placeholder={t('profile.password.confirmPlaceholder')}
            autoComplete="new-password" show={showPw} type={showPw ? 'text' : 'password'}
          />

          <label className="flex items-center gap-2 text-sm text-gray-500 select-none cursor-pointer">
            <input type="checkbox" checked={showPw} onChange={() => setShowPw(s => !s)} className="rounded" />
            {showPw ? t('profile.password.hide') : t('profile.password.show')}
          </label>

          {pwError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 flex items-start gap-2">
              <span>⚠️</span><span>{pwError}</span>
            </div>
          )}
          {pwSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl p-3 flex items-start gap-2">
              <span>✅</span><span>{pwSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/30 active:scale-[0.98]"
          >
            {submitting ? t('profile.password.saving') : t('profile.password.submit')}
          </button>
        </form>
      </Section>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-lg mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value, last }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${last ? '' : 'border-b border-gray-100'}`}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-bold text-gray-800 text-end">{value}</span>
    </div>
  );
}

function PwField({ label, value, onChange, placeholder, autoComplete, type }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
      />
    </div>
  );
}
