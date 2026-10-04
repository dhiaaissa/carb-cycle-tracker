import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { PageHeader, Panel } from './ui/primitives';


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
        <p className="text-sm text-ink-500" role="status">{t('app.loading')}</p>
      </div>
    );
  }
  if (!profile) return <div className="text-ink-500">{t('auth.error.generic')}</div>;

  const initial = (profile.username || '?').charAt(0).toUpperCase();
  const memberSince = profile.created_at ? formatDate(profile.created_at, { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const isCarb = profile.programme === 'carb_cycle';

  const fmtVal = (val, fmtKey, params) => (val == null || val === '') ? t('profile.notSet') : t(fmtKey, params);

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow={memberSince ? t('profile.memberSince', { date: memberSince }) : undefined}
        title={`@${profile.username}`}
        actions={profile.is_owner && <span className="text-xs font-semibold text-door-700 border border-door-200 bg-door-50 px-2 py-1 rounded-md">{t('profile.ownerBadge')}</span>}
      />

      {/* Account */}
      <Section title={t('profile.section.account')}>
        <Row label={t('profile.field.username')} value={`@${profile.username}`} />
        <Row label={t('profile.field.programme')} value={`${t('programme.' + (profile.programme === 'recomp' ? 'body_recomp' : profile.programme))}`} />
        {profile.start_date && <Row label={t('profile.field.startDate')} value={formatDate(profile.start_date + 'T12:00:00', { year: 'numeric', month: 'short', day: 'numeric' })} />}
        <Row label={t('profile.field.daysLogged')} value={String(profile.days_logged)} last />
      </Section>

      {/* Body & programme */}
      <Section title={t('profile.section.body')}>
        <Row label={t('profile.field.sex')} value={profile.sex ? t('profile.sex.' + profile.sex) : t('profile.notSet')} />
        <Row label={t('profile.field.age')} value={fmtVal(profile.age, 'profile.years', { age: profile.age })} />
        <Row label={t('profile.field.height')} value={fmtVal(profile.height_cm, 'profile.cm', { value: profile.height_cm })} />
        <Row label={t('profile.field.activity')} value={profile.activity_level ? t('profile.activity.' + profile.activity_level) : t('profile.notSet')} />
        <Row label={t('profile.field.currentWeight')} value={fmtVal(profile.current_weight_kg, 'profile.kg', { value: profile.current_weight_kg })} />
        <Row label={t('profile.field.goalWeight')} value={fmtVal(profile.goal_weight_kg, 'profile.kg', { value: profile.goal_weight_kg })} last />
        {onEditProgramme && (
          <button
            onClick={onEditProgramme}
            className="mt-4 h-10 px-4 rounded-lg border border-ink-200 bg-white hover:bg-ink-100 text-ink-900 font-semibold text-sm"
          >
            {t('profile.editProgramme')}
          </button>
        )}
      </Section>

      {/* Targets (only for calculator programmes) */}
      {!isCarb && profile.calorie_target != null && (
        <Section title={t('profile.section.targets')}>
          <Row label={t('macro.calories')} value={t('profile.kcal', { value: profile.calorie_target })} />
          <Row label={t('macro.protein')} value={t('profile.grams', { value: profile.protein_g_target })} />
          <Row label={t('macro.carbs')} value={t('profile.grams', { value: profile.carbs_g_target })} />
          <Row label={t('macro.fat')} value={t('profile.grams', { value: profile.fat_g_target })} last />
        </Section>
      )}

      {/* Change password */}
      <Section title={t('profile.section.password')}>
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

          <label className="flex items-center gap-2 text-sm text-ink-600 select-none cursor-pointer">
            <input type="checkbox" checked={showPw} onChange={() => setShowPw(s => !s)} className="w-4 h-4 rounded border-ink-300 accent-door-600" />
            {showPw ? t('profile.password.hide') : t('profile.password.show')}
          </label>

          {pwError && (
            <div role="alert" className="bg-clay-50 border border-clay-200 text-clay-700 text-sm rounded-lg p-3">
              <span>{pwError}</span>
            </div>
          )}
          {pwSuccess && (
            <div role="status" className="bg-olive-50 border border-olive-200 text-olive-800 text-sm rounded-lg p-3">
              <span>{pwSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="h-11 px-5 bg-door-600 hover:bg-door-700 disabled:opacity-60 text-white font-semibold rounded-lg"
          >
            {submitting ? t('profile.password.saving') : t('profile.password.submit')}
          </button>
        </form>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <Panel title={title} className="mb-6" bodyClassName="px-5 sm:px-6 pb-5 pt-2">{children}</Panel>
  );
}

function Row({ label, value, last }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-2.5 ${last ? '' : 'border-b border-ink-200'}`}>
      <span className="text-sm text-ink-500">{label}</span>
      <span className="text-sm font-medium text-ink-900 text-end tabular-nums">{value}</span>
    </div>
  );
}

function PwField({ label, value, onChange, placeholder, autoComplete, type }) {
  const id = `pw-${autoComplete}-${label.length}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full h-11 px-3.5 border border-ink-300 rounded-lg bg-white text-ink-900 placeholder:text-ink-400 outline-none focus:border-door-600 focus:ring-2 focus:ring-door-200"
      />
    </div>
  );
}
