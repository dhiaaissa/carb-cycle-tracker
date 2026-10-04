import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react';
import { api, auth } from '../lib/api';
import { useLanguageDirection } from '../lib/i18nDirection';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import ProgressRing from './ui/ProgressRing';
import { BrandMark } from './ui/SideNav';

// A real slice of the product instead of marketing cards: two weeks of the
// logbook and one day's numbers, drawn with the same pieces the app uses.
const SAMPLE_WEEKS = [
  ['med', 'low', 'med', 'low', 'med', 'low', 'med'],
  ['low', 'low', 'low', 'med', 'low', 'low', 'low'],
];
const SAMPLE_CELL = { low: 'bg-door-500', med: 'bg-saffron-400', high: 'bg-olive-600' };

function Specimen() {
  const { t } = useTranslation();
  return (
    <figure className="bg-white border border-ink-200 rounded-xl p-5 max-w-md" aria-label={t('auth.sample.aria')}>
      <div className="flex items-center gap-5">
        <ProgressRing value={1240} max={1986} size={104} stroke={10} colorClass="text-door-600" label="">
          <span className="font-display text-2xl font-semibold text-ink-900 leading-none">746</span>
          <span className="text-[10px] text-ink-500 mt-0.5">{t('today.kcalLeft')}</span>
        </ProgressRing>
        <div className="min-w-0">
          <div className="text-xs text-ink-500">{t('auth.sample.day')}</div>
          <div className="font-display text-lg font-semibold text-ink-900">{t('dayType.low')}</div>
          <dl className="mt-2 grid grid-cols-3 gap-3 text-xs">
            {[['protein', 96, 128, 'bg-door-600'], ['carbs', 58, 99, 'bg-saffron-500'], ['fat', 61, 120, 'bg-olive-600']].map(([m, have, need, bar]) => (
              <div key={m}>
                <dt className="text-ink-500">{t(`macro.${m}`)}</dt>
                <dd className="font-semibold text-ink-900 tabular-nums">{have}<span className="text-ink-400 font-normal">/{need}g</span></dd>
                <div className="mt-1 h-1 rounded-full bg-ink-100"><div className={`h-1 rounded-full ${bar}`} style={{ width: `${(have / need) * 100}%` }} /></div>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="mt-5 space-y-1.5" aria-hidden="true">
        {SAMPLE_WEEKS.map((week, w) => (
          <div key={w} className="flex items-center gap-2">
            <span className="w-14 text-[11px] text-ink-500">{t('log.weekShort', { num: w + 3 })}</span>
            <div className="grid grid-cols-7 gap-1 flex-1">
              {week.map((type, d) => (
                <span key={d} className={`h-5 rounded-[3px] ${w === 1 && d > 1 ? 'bg-ink-100' : SAMPLE_CELL[type]} ${w === 1 && d === 1 ? 'ring-2 ring-ink-900 ring-offset-1 ring-offset-white' : ''}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}

export default function LoginPage({ onAuth }) {
  const { t } = useTranslation();
  useLanguageDirection();

  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const switchMode = (m) => { setMode(m); setError(''); };
  const input = 'w-full h-12 px-3.5 border border-ink-300 rounded-lg bg-white text-ink-900 placeholder:text-ink-400 outline-none focus:border-door-600 focus:ring-2 focus:ring-door-200';

  return (
    <div className="min-h-screen-safe bg-page text-ink-900 flex flex-col">
      <header className="flex items-center justify-between px-5 sm:px-10 h-16 pt-safe ps-safe pe-safe">
        <div className="flex items-center gap-2.5">
          <BrandMark size={30} />
          <span className="font-display text-lg font-semibold">{t('auth.brand')}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher persist={false} />
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-5 sm:px-10 py-8 lg:py-16 grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 items-start pb-safe">
        {/* Pitch */}
        <section className="lg:pt-6">
          <h1 className="font-display text-[34px] sm:text-5xl font-semibold leading-[1.05] text-ink-900 max-w-xl">
            {t('auth.hero.title')}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-ink-600 leading-relaxed max-w-lg">{t('auth.hero.subtitle')}</p>

          <div className="hidden lg:block mt-10"><Specimen /></div>

          <ul className="hidden lg:block mt-8 space-y-2 text-sm text-ink-700 max-w-md">
            {['auth.point.targets', 'auth.point.languages', 'auth.point.free'].map((k) => (
              <li key={k} className="flex gap-3"><span aria-hidden="true" className="mt-2 w-3 h-px bg-ink-400 shrink-0" />{t(k)}</li>
            ))}
          </ul>
        </section>

        {/* Form */}
        <section className="w-full max-w-md lg:justify-self-end bg-white border border-ink-200 rounded-xl p-6 sm:p-8" aria-labelledby="auth-heading">
          <div role="tablist" aria-label={t('auth.tabsAria')} className="flex border-b border-ink-200 mb-6 -mx-1">
            {[['login', 'auth.tab.login'], ['register', 'auth.tab.signup']].map(([m, key]) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`px-1 me-6 pb-3 -mb-px text-sm font-semibold border-b-2 ${mode === m ? 'border-door-600 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-800'}`}
              >
                {t(key)}
              </button>
            ))}
          </div>

          <h2 id="auth-heading" className="font-display text-2xl font-semibold text-ink-900">
            {mode === 'login' ? t('auth.card.welcome') : t('auth.card.create')}
          </h2>
          <p className="text-sm text-ink-500 mt-1 mb-6">
            {mode === 'login' ? t('auth.card.welcomeSub') : t('auth.card.createSub')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-ink-700 mb-1.5">{t('auth.field.username')}</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                required
                placeholder={t('auth.placeholder.username')}
                className={input}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-700 mb-1.5">{t('auth.field.password')}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  enterKeyHint="go"
                  required
                  placeholder={mode === 'register' ? t('auth.placeholder.passwordNew') : t('auth.placeholder.passwordLogin')}
                  className={`${input} pe-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 end-0 w-12 flex items-center justify-center text-ink-500 hover:text-ink-800"
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 text-sm text-clay-700 bg-clay-50 border border-clay-200 rounded-lg p-3">
                <WarningCircle size={18} className="shrink-0 mt-px" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-lg bg-door-600 hover:bg-door-700 disabled:opacity-60 text-white font-semibold"
            >
              {submitting ? t('auth.submit.working') : mode === 'login' ? t('auth.submit.login') : t('auth.submit.signup')}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
