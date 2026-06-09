import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api, auth } from '../lib/api';
import { useLanguageDirection } from '../lib/i18nDirection';
import LanguageSwitcher from './LanguageSwitcher';

const FEATURES = [
  { icon: '🎯', titleKey: 'auth.feature.macros.title',     textKey: 'auth.feature.macros.text' },
  { icon: '📝', titleKey: 'auth.feature.tracking.title',   textKey: 'auth.feature.tracking.text' },
  { icon: '📈', titleKey: 'auth.feature.progress.title',   textKey: 'auth.feature.progress.text' },
  { icon: '🔄', titleKey: 'auth.feature.programmes.title', textKey: 'auth.feature.programmes.text' },
];

export default function LoginPage({ onAuth }) {
  const { t } = useTranslation();
  useLanguageDirection();

  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fn = mode === 'login' ? api.login : api.register;
      const { token, user } = await fn(username.trim(), password);
      auth.setSession(token, user);
      onAuth(user, mode === 'register');
    } catch (err) {
      setError(err.message || t('auth.error.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950">
      {/* ===== Left / Hero ===== */}
      <div className="relative lg:w-3/5 overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 text-white flex flex-col">
        {/* Decorative animated blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -start-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -end-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-24 start-1/3 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between p-5 sm:p-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg">💪</div>
            <span className="font-bold text-lg tracking-tight">{t('auth.brand')}</span>
          </div>
          <LanguageSwitcher persist={false} variant="onDark" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 self-start bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3.5 py-1.5 text-xs font-semibold text-indigo-100 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t('auth.hero.badge')}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5">
            {t('auth.hero.title')}
          </h1>
          <p className="text-base sm:text-lg text-indigo-100/80 leading-relaxed mb-8 max-w-xl">
            {t('auth.hero.subtitle')}
          </p>

          {/* CTA (mobile mainly) */}
          <button
            onClick={() => { setMode('register'); scrollToForm(); }}
            className="lg:hidden self-start bg-white text-indigo-700 font-bold px-6 py-3 rounded-2xl shadow-xl hover:scale-[1.03] active:scale-95 transition-transform mb-8"
          >
            {t('auth.hero.cta')} →
          </button>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 max-w-md mb-10">
            <Stat value={t('auth.hero.stat1Value')} label={t('auth.hero.stat1Label')} />
            <Stat value={t('auth.hero.stat2Value')} label={t('auth.hero.stat2Label')} />
            <Stat value={t('auth.hero.stat3Value')} label={t('auth.hero.stat3Label')} />
          </div>

          {/* Feature grid */}
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
            {FEATURES.map(f => (
              <div key={f.titleKey} className="flex items-start gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
                <div className="text-2xl shrink-0">{f.icon}</div>
                <div className="min-w-0">
                  <div className="font-bold text-sm mb-0.5">{t(f.titleKey)}</div>
                  <div className="text-xs text-indigo-100/70 leading-relaxed">{t(f.textKey)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 px-6 sm:px-10 lg:px-16 pb-6 text-xs text-indigo-200/50">
          {t('auth.footer')}
        </div>
      </div>

      {/* ===== Right / Auth card ===== */}
      <div className="lg:w-2/5 bg-slate-50 flex items-center justify-center p-5 sm:p-8 lg:p-10">
        <div ref={formRef} className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-900/10 border border-gray-100 p-7 sm:p-9">
            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
                {mode === 'login' ? t('auth.card.welcome') : t('auth.card.create')}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === 'login' ? t('auth.card.welcomeSub') : t('auth.card.createSub')}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t('auth.tab.login')}
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'register' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t('auth.tab.signup')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.field.username')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 start-0 flex items-center ps-3.5 text-gray-400 pointer-events-none">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                    autoFocus
                    placeholder={t('auth.placeholder.username')}
                    className="w-full ps-9 pe-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.field.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    placeholder={mode === 'register' ? t('auth.placeholder.passwordNew') : t('auth.placeholder.passwordLogin')}
                    className="w-full ps-4 pe-12 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 flex items-start gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/30 active:scale-[0.98]"
              >
                {submitting ? t('auth.submit.working') : mode === 'login' ? t('auth.submit.login') : t('auth.submit.signup')}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              {mode === 'login' ? t('auth.switch.toSignupQ') : t('auth.switch.toLoginQ')}{' '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="text-indigo-600 font-bold hover:underline"
              >
                {mode === 'login' ? t('auth.switch.toSignup') : t('auth.switch.toLogin')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-3 py-3 text-center">
      <div className="text-2xl sm:text-3xl font-extrabold">{value}</div>
      <div className="text-[11px] text-indigo-100/60 font-semibold uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}
