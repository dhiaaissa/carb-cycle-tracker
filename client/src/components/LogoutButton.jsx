import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function LogoutButton({ onLogout, username, compact = false }) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const onKey = (e) => { if (e.key === 'Escape') setConfirming(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirming]);

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        title={t('header.logoutTitle')}
        className={compact
          ? 'sm:hidden h-10 px-2 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 text-xs font-medium'
          : 'h-8 px-2 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 text-xs font-medium'}
      >
        {t('header.logout')}
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setConfirming(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6 sm:p-7 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            
            <h3 className="text-xl font-extrabold text-ink-900 mb-1">{t('logout.confirmTitle')}</h3>
            {username && <p className="text-sm font-semibold text-door-600 mb-1">@{username}</p>}
            <p className="text-sm text-ink-500 mb-6">{t('logout.confirmText')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-3 rounded-2xl border border-ink-200 text-ink-600 font-bold hover:bg-ink-50 transition-colors"
              >
                {t('logout.cancel')}
              </button>
              <button
                onClick={onLogout}
                className="flex-1 py-3 rounded-2xl bg-clay-600 hover:bg-clay-700 text-white font-bold transition-colors"
              >
                {t('logout.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
