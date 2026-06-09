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
          ? 'sm:hidden text-gray-400 hover:text-red-600 px-2 py-1 rounded text-xs font-bold transition-colors'
          : 'text-gray-400 hover:text-red-600 px-2 py-1 rounded text-xs font-bold transition-colors'}
      >
        {t('header.logout')}
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setConfirming(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-7 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center text-3xl mb-4">👋</div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-1">{t('logout.confirmTitle')}</h3>
            {username && <p className="text-sm font-semibold text-indigo-600 mb-1">@{username}</p>}
            <p className="text-sm text-gray-500 mb-6">{t('logout.confirmText')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
              >
                {t('logout.cancel')}
              </button>
              <button
                onClick={onLogout}
                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/30 transition-colors"
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
