import { useTranslation } from 'react-i18next';
import { DownloadSimple, CheckCircle, Export } from '@phosphor-icons/react';
import { useOfflineState, promptInstall, isStandalone } from '../lib/offline';
import { Panel } from './ui/primitives';

/**
 * "Install the app": one button where the browser offers installation;
 * otherwise (iPhone Safari, some others) the two manual steps.
 */
export default function InstallApp({ className = 'mb-6' }) {
  const { t } = useTranslation();
  const { installPrompt } = useOfflineState();

  return (
    <Panel title={t('install.title')} className={className}>
      <div className="-mt-1 text-sm text-ink-700 space-y-3">
        {isStandalone() ? (
          <p className="flex items-center gap-2 text-olive-700"><CheckCircle size={18} weight="fill" aria-hidden="true" />{t('install.installed')}</p>
        ) : installPrompt ? (
          <>
            <p>{t('install.why')}</p>
            <button type="button" onClick={promptInstall}
              className="h-10 px-4 rounded-lg bg-door-600 hover:bg-door-700 text-white font-semibold flex items-center gap-2">
              <DownloadSimple size={18} aria-hidden="true" />{t('install.button')}
            </button>
          </>
        ) : (
          <>
            <p>{t('install.why')}</p>
            <ol className="space-y-1.5 ps-5 list-decimal marker:text-ink-400">
              <li>{t('install.step1')} <Export size={16} className="inline align-text-bottom text-door-600" aria-label={t('install.shareIcon')} /></li>
              <li>{t('install.step2')}</li>
            </ol>
            <p className="text-xs text-ink-500">{t('install.otherBrowsers')}</p>
          </>
        )}
      </div>
    </Panel>
  );
}
