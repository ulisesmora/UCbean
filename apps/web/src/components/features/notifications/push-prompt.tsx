'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2, Share, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { needsHomeScreen, pushConfigured, pushState, subscribePush } from '@/lib/push';

type View = 'ask' | 'install' | 'blocked' | null;

const DISMISSED = 'atb:push-prompt-dismissed';

/**
 * Notifications, offered where someone signed in will see them.
 *
 * Before, the only way to turn them on was a button on the order tracker, and
 * on an iPhone that button hid itself without a word: Safari only delivers web
 * push to a site added to the Home Screen. This card says what to do in every
 * case: ask, explain the Home Screen step, or explain how to unblock.
 */
export function PushPrompt({ className = '' }: { className?: string }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [view, setView] = useState<View>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    if (!pushConfigured) {
      console.warn('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing from this build.');
      return;
    }
    const estado = pushState();
    if (estado === 'granted') {
      // Allowed before: register again quietly so this device keeps receiving
      // them. The API upserts by endpoint, so this never duplicates.
      subscribePush(accessToken).catch(() => {});
      return;
    }
    try {
      if (localStorage.getItem(DISMISSED)) return;
    } catch {
      // No storage: show the card anyway.
    }
    setView(
      estado === 'default'
        ? 'ask'
        : estado === 'denied'
          ? 'blocked'
          : needsHomeScreen()
            ? 'install'
            : null,
    );
  }, [accessToken]);

  if (!view) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED, '1');
    } catch {
      // Hidden for this visit only.
    }
    setView(null);
  };

  const brave = 'brave' in navigator;
  const copy = {
    ask: {
      Icon: Bell,
      title: 'Know the moment your coffee is ready',
      body: 'Turn on notifications and we will tell you when your order is on the counter.',
    },
    install: {
      Icon: Share,
      title: 'Get notified on your iPhone',
      body: 'iPhone only sends notifications to apps on the Home Screen. In Safari tap Share, then Add to Home Screen. Open Around the Bean from there and turn them on.',
    },
    blocked: {
      Icon: BellOff,
      title: 'Notifications are blocked',
      body: brave
        ? 'Brave blocks them by default. Turn on "Use Google services for push messaging" in brave://settings/privacy, allow notifications for this site, then reload.'
        : 'Allow notifications for this site in your browser settings (the icon next to the address bar), then reload this page.',
    },
  }[view];

  async function turnOn() {
    setBusy(true);
    try {
      const r = await subscribePush(accessToken!);
      if (r === 'granted') {
        toast.success('Notifications are on');
        setView(null);
      } else if (r === 'denied') {
        setView('blocked');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not turn on notifications');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="status" className={`glass glass-edge flex items-start gap-3 p-4 ${className}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border-2 border-stone2-900 bg-neon-500">
        <copy.Icon size={18} className="text-stone2-900" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold leading-tight text-stone2-900">{copy.title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-stone2-600">{copy.body}</p>
        {view === 'ask' && (
          <button
            type="button"
            onClick={turnOn}
            disabled={busy}
            className="btn tap-target mt-3 px-5 py-2 text-[14px] disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
            Turn on notifications
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="tap-target -mr-2 -mt-2 flex items-center justify-center p-2 text-stone2-400 hover:text-stone2-900"
      >
        <X size={16} />
      </button>
    </div>
  );
}
