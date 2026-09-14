import { create } from 'zustand';

/**
 * Where someone is, as far as adding the app to their home screen goes.
 *
 * - `installed`: already opened from the home screen.
 * - `prompt`: Chrome, Edge or Samsung Internet handed us the install dialog.
 * - `android`: Android without the dialog yet (Firefox, or Chrome still deciding).
 * - `ios-safari` / `ios-other`: iPhone or iPad. Apple has no install dialog,
 *   only the Share menu, and Chrome on iOS reaches it from the address bar.
 * - `in-app`: Instagram, TikTok, Facebook... Their built-in browsers cannot
 *   install anything: the page has to be opened in the real browser first.
 * - `desktop`: a computer. The app is for the phone.
 */
export type InstallContext =
  'installed' | 'prompt' | 'android' | 'ios-safari' | 'ios-other' | 'in-app' | 'desktop';

const IN_APP =
  /Instagram|FBAN|FBAV|FB_IAB|FBIOS|TikTok|musical_ly|BytedanceWebview|Snapchat|Line\/|MicroMessenger|LinkedInApp|Twitter/i;

export function installContext(env: {
  ua: string;
  standalone: boolean;
  hasPrompt: boolean;
  /** iPadOS reports itself as a Mac; touch points give it away. */
  touchMac?: boolean;
}): InstallContext {
  if (env.standalone) return 'installed';
  if (IN_APP.test(env.ua)) return 'in-app';
  const ios = /iPhone|iPad|iPod/.test(env.ua) || Boolean(env.touchMac);
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS/.test(env.ua) ? 'ios-other' : 'ios-safari';
  if (env.hasPrompt) return 'prompt';
  if (/Android/.test(env.ua)) return 'android';
  return 'desktop';
}

/** The browser's install event, which is not in the DOM typings yet. */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * The install dialog Chrome offers, kept for when the person asks for it.
 *
 * The browser fires it once, early, often before the /app page is open. It is
 * caught at startup (see PwaHost) and parked here, so any button can use it.
 */
export const useInstallPrompt = create<{
  event: InstallPromptEvent | null;
  installed: boolean;
}>(() => ({ event: null, installed: false }));

export function currentContext(): InstallContext {
  if (typeof window === 'undefined') return 'desktop';
  return installContext({
    ua: navigator.userAgent,
    standalone:
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    hasPrompt: Boolean(useInstallPrompt.getState().event),
    touchMac: navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1,
  });
}

/** Opens Chrome's install dialog. Resolves true when the person accepted. */
export async function promptInstall(): Promise<boolean> {
  const { event } = useInstallPrompt.getState();
  if (!event) return false;
  await event.prompt();
  const { outcome } = await event.userChoice;
  // The event is single use either way.
  useInstallPrompt.setState({ event: null, installed: outcome === 'accepted' });
  return outcome === 'accepted';
}

/** Where the install came from: the QR placement that brought the person in. */
export const SOURCE_KEY = 'atb:install-source';

export function rememberSource(source: string | null) {
  if (!source) return;
  try {
    localStorage.setItem(SOURCE_KEY, source.slice(0, 40));
  } catch {
    // Not remembered: the install still counts, under "direct".
  }
}
