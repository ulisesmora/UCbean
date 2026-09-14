'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowDown,
  BellRing,
  Check,
  Copy,
  Download,
  EllipsisVertical,
  Heart,
  Plus,
  Share,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { PushPrompt } from '@/components/features/notifications/push-prompt';
import {
  currentContext,
  promptInstall,
  rememberSource,
  useInstallPrompt,
  type InstallContext,
} from '@/lib/install';

type Step = { Icon: typeof Share; title: string; detail: string };

const OPEN_IT: Step = {
  Icon: Smartphone,
  title: 'Open it from your home screen',
  detail: 'Around the Bean is there now, like any app. Open it and sign in once.',
};

const STEPS: Partial<Record<InstallContext, Step[]>> = {
  'ios-safari': [
    {
      Icon: Share,
      title: 'Tap Share',
      detail:
        "The square with an arrow in Safari's toolbar. On newer iPhones it can sit behind the ⋯ button.",
    },
    {
      Icon: Plus,
      title: 'Tap Add to Home Screen',
      detail: "Scroll the menu down if you don't see it, then tap Add.",
    },
    OPEN_IT,
  ],
  'ios-other': [
    {
      Icon: Share,
      title: 'Tap Share',
      detail: 'The square with an arrow, next to the address bar.',
    },
    {
      Icon: Plus,
      title: 'Tap Add to Home Screen',
      detail: "Scroll the menu down if you don't see it, then tap Add.",
    },
    OPEN_IT,
  ],
  android: [
    { Icon: EllipsisVertical, title: 'Tap the ⋮ menu', detail: 'Top right of your browser.' },
    { Icon: Download, title: 'Tap Install app', detail: 'Some phones call it Add to Home screen.' },
    OPEN_IT,
  ],
};

const PERKS = [
  { Icon: BellRing, text: 'A ping the moment your coffee is ready' },
  { Icon: Heart, text: 'Your usuals, one tap away' },
  { Icon: Sparkles, text: '+50 points the first time you open it signed in' },
];

/**
 * The page every QR code points to.
 *
 * It works out where the person is and shows only what applies there: one
 * button on Android, three steps on iPhone, "open this in your browser" inside
 * Instagram or TikTok, and nothing to do if the app is already installed.
 */
export function InstallGuide() {
  const event = useInstallPrompt((s) => s.event);
  const installed = useInstallPrompt((s) => s.installed);
  const [ctx, setCtx] = useState<InstallContext | null>(null);
  const [iphone, setIphone] = useState(false);
  const [android, setAndroid] = useState(false);

  useEffect(() => {
    rememberSource(new URLSearchParams(location.search).get('src'));
    setIphone(/iPhone|iPod/.test(navigator.userAgent));
    setAndroid(/Android/.test(navigator.userAgent));
  }, []);
  useEffect(() => setCtx(installed ? 'installed' : currentContext()), [event, installed]);

  return (
    <div className="mx-auto max-w-md px-5 pb-40 pt-10 md:pt-16">
      {/* eslint-disable-next-line @next/next/no-img-element -- static app icon */}
      <img
        src="/icons/icon-192.png"
        alt=""
        className="mb-5 h-[72px] w-[72px] rounded-[16px] border-2 border-stone2-900 shadow-[3px_3px_0_#0A0A0A]"
      />
      <p className="mb-2 text-[12px] uppercase tracking-[0.2em] text-forest-700">
        Around the Bean app
      </p>
      <h1 className="text-balance text-[34px] font-extrabold leading-[1.02] text-stone2-900">
        Your coffee, one tap from your home screen.
      </h1>

      <ul className="mb-8 mt-5 flex flex-col gap-2.5">
        {PERKS.map(({ Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-[15px] text-stone2-900">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border-2 border-stone2-900 bg-neon-500">
              <Icon size={15} strokeWidth={2.2} />
            </span>
            {text}
          </li>
        ))}
      </ul>

      {ctx === null && <div aria-hidden="true" className="glass glass-edge h-48 animate-pulse" />}

      {ctx === 'installed' && (
        <section className="flex flex-col gap-4">
          <p className="flex items-center gap-2 text-[16px] font-bold text-forest-700">
            <Check size={18} strokeWidth={3} /> You have the app.
          </p>
          <PushPrompt />
          <Link href="/order" className="btn tap-target justify-center py-3 text-[15px]">
            Order now
          </Link>
        </section>
      )}

      {ctx === 'prompt' && (
        <section>
          <button
            type="button"
            onClick={async () => {
              if (await promptInstall())
                toast.success('Installed. Open Around the Bean from your home screen.');
            }}
            className="btn tap-target w-full justify-center py-3.5 text-[16px]"
          >
            <Download size={17} />
            Install Around the Bean
          </button>
          <p className="mt-3 text-center text-[13px] text-stone2-600">
            Free, no app store, under 1 MB.
          </p>
        </section>
      )}

      {ctx && STEPS[ctx] && (
        <ol className="flex flex-col gap-3">
          {STEPS[ctx]!.map(({ Icon, title, detail }, i) => (
            <li key={title} className="glass glass-edge flex items-start gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-stone2-900 bg-birch-50 text-[15px] font-extrabold tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[16px] font-bold text-stone2-900">
                  {title}
                  <Icon size={17} strokeWidth={2.2} className="shrink-0" />
                </p>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-stone2-600">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {ctx === 'in-app' && (
        <section className="flex flex-col gap-3">
          <div className="glass glass-edge p-4">
            <p className="text-[16px] font-bold text-stone2-900">
              Open this page in your browser first
            </p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-stone2-600">
              Instagram, TikTok and similar apps open links in their own browser, which cannot add
              apps to your home screen. Tap ⋯ and choose Open in browser, or copy the link.
            </p>
          </div>
          {android && (
            <a
              href={`intent://${typeof location === 'undefined' ? '' : location.host + location.pathname + location.search}#Intent;scheme=https;package=com.android.chrome;end`}
              className="btn tap-target justify-center py-3 text-[15px]"
            >
              Open in Chrome
            </a>
          )}
          <button
            type="button"
            onClick={() =>
              navigator.clipboard
                .writeText(location.href)
                .then(() =>
                  toast.success(`Link copied. Paste it in ${iphone ? 'Safari' : 'your browser'}.`),
                )
                .catch(() => toast.error('Could not copy. Tap ⋯ and Open in browser instead.'))
            }
            className="btn tap-target justify-center py-3 text-[15px]"
          >
            <Copy size={16} />
            Copy link
          </button>
        </section>
      )}

      {ctx === 'desktop' && (
        <div className="glass glass-edge p-5">
          <p className="text-[16px] font-bold text-stone2-900">Open this page on your phone</p>
          <p className="mt-1 text-[14px] leading-relaxed text-stone2-600">
            The app lives on your phone&apos;s home screen. Scan the QR at the counter, or visit
          </p>
          <p className="mt-2 break-all font-mono text-[15px] font-bold text-stone2-900">
            {typeof location === 'undefined' ? '' : `${location.host}/app`}
          </p>
        </div>
      )}

      {ctx === 'ios-safari' && iphone && (
        // Safari's Share button lives in the bottom toolbar on iPhone.
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex flex-col items-center gap-1 pb-safe md:hidden"
        >
          <span className="rounded-full border-2 border-stone2-900 bg-neon-500 px-3 py-1 text-[12px] font-bold text-stone2-900">
            Share is in the toolbar below
          </span>
          <ArrowDown
            size={26}
            strokeWidth={3}
            className="text-stone2-900 motion-safe:animate-bounce"
          />
        </div>
      )}
    </div>
  );
}
