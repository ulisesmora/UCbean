'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { loyaltyApi } from '@/lib/api';
import {
  currentContext,
  SOURCE_KEY,
  useInstallPrompt,
  type InstallPromptEvent,
} from '@/lib/install';
import { useAuthStore } from '@/stores/auth.store';
import { InstallBanner } from './install-invite';

/**
 * Everything the installed app needs, mounted once.
 *
 * - Registers the service worker on load, so the offline page and the install
 *   dialog work before anyone touches notifications.
 * - Catches Chrome's install dialog, which fires once and early, so the /app
 *   page, the banner and the tracker can open it later with one tap.
 * - The first time someone signed in opens the app from the home screen, it
 *   claims the install points, tagged with the QR that brought them.
 */
export function PwaHost() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const email = useAuthStore((s) => s.user?.email);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

    const onPrompt = (e: Event) => {
      // Our own button shows it, at a moment the person understands.
      e.preventDefault();
      useInstallPrompt.setState({ event: e as InstallPromptEvent });
    };
    const onInstalled = () => useInstallPrompt.setState({ event: null, installed: true });
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!accessToken || currentContext() !== 'installed') return;
    const key = `atb:app-install-claimed:${email ?? 'me'}`;
    let source = 'direct';
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
      // On iPhone the home screen app has its own storage, so the QR source
      // saved in Safari is often gone here and the install counts as direct.
      source = localStorage.getItem(SOURCE_KEY) || 'direct';
    } catch {
      return;
    }
    loyaltyApi
      .appInstall(accessToken, source)
      .then((r) => {
        if (r.awarded > 0)
          toast.success(`+${r.awarded} points for adding Around the Bean to your home screen`);
      })
      .catch(() => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Tried again next launch.
        }
      });
  }, [accessToken, email]);

  return <InstallBanner />;
}
