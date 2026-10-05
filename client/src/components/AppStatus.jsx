import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { CloudSlash, ArrowsClockwise, Sparkle } from '@phosphor-icons/react';
import { useOfflineState } from '../lib/offline';
import { syncOutbox } from '../lib/api';

/**
 * Thin status strip under the header: offline, changes waiting to sync, or a
 * new app version ready. Renders nothing in the normal case.
 */
export default function AppStatus() {
  const { t } = useTranslation();
  const { online, pending, syncing } = useOfflineState();
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    // Check for a new version every hour while the app stays open (installed apps rarely reload).
    onRegisteredSW(_url, reg) { if (reg) setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000); },
  });

  let content = null;
  if (!online) {
    content = (
      <>
        <CloudSlash size={18} className="shrink-0" aria-hidden="true" />
        <span>{pending ? t('offline.offlinePending', { count: pending }) : t('offline.offline')}</span>
      </>
    );
  } else if (pending) {
    content = (
      <>
        <ArrowsClockwise size={18} className={`shrink-0 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span>{syncing ? t('offline.syncing', { count: pending }) : t('offline.waiting', { count: pending })}</span>
        {!syncing && <button type="button" onClick={() => syncOutbox()} className="ms-auto font-semibold underline underline-offset-2">{t('offline.syncNow')}</button>}
      </>
    );
  } else if (needRefresh) {
    content = (
      <>
        <Sparkle size={18} className="shrink-0" aria-hidden="true" />
        <span>{t('offline.updateReady')}</span>
        <span className="ms-auto flex gap-4">
          <button type="button" onClick={() => setNeedRefresh(false)} className="opacity-80 hover:opacity-100">{t('adaptive.dismiss')}</button>
          <button type="button" onClick={() => updateServiceWorker(true)} className="font-semibold underline underline-offset-2">{t('offline.reload')}</button>
        </span>
      </>
    );
  }
  if (!content) return null;

  return (
    <div role="status" aria-live="polite"
      className={`flex items-center gap-2.5 px-4 sm:px-6 py-2 text-sm border-b ${
        !online ? 'bg-ink-800 text-white border-ink-800' : 'bg-door-50 text-door-900 border-door-200'}`}>
      {content}
    </div>
  );
}
