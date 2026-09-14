'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  BellRing,
  Check,
  Copy,
  Download,
  Heart,
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
import { PhoneDemo, type DemoScene } from './phone-demo';

type Step = { scene: DemoScene; title: string; detail: string };

const OPEN_IT: Step = {
  scene: 'home',
  title: 'Open Around the Bean',
  detail: 'It is on your home screen now, like any app. Open it and sign in once.',
};

const ADD_AND_OPEN: Step[] = [
  {
    scene: 'ios-sheet',
    title: 'Scroll down and tap Add to Home Screen',
    detail: 'It is near the bottom of the list.',
  },
  { scene: 'ios-add', title: 'Tap Add', detail: 'In the top right corner.' },
  OPEN_IT,
];

const STEPS: Partial<Record<InstallContext, Step[]>> = {
  'ios-safari': [
    {
      scene: 'ios-share-bottom',
      title: 'Tap the Share button',
      detail:
        'The square with an arrow, at the bottom of Safari. On newer iPhones tap ⋯ first, then Share.',
    },
    ...ADD_AND_OPEN,
  ],
  'ios-other': [
    {
      scene: 'ios-share-top',
      title: 'Tap the Share button',
      detail: 'The square with an arrow, at the top next to the address.',
    },
    ...ADD_AND_OPEN,
  ],
  android: [
    {
      scene: 'android-dots',
      title: 'Tap the ⋮ button',
      detail: 'The three dots in the top right corner.',
    },
    {
      scene: 'android-menu',
      title: 'Tap Install app',
      detail: 'Some phones say Add to Home screen.',
    },
    { scene: 'android-install', title: 'Tap Install', detail: 'Your phone asks once to confirm.' },
    OPEN_IT,
  ],
};

const PERKS = [
  { Icon: BellRing, text: 'A ping the moment your coffee is ready' },
  { Icon: Heart, text: 'Your usuals, one tap away' },
  { Icon: Sparkles, text: '+50 points the first time you open it signed in' },
];

/**
 * One step at a time, big, with the gesture acted out.
 *
 * A list of three instructions loses people halfway: they switch to the Share
 * menu, come back, and no longer know which line they were on. One screen per
 * step, a phone showing where to tap, and a single big "next" button.
 */
function Stepper({ steps, arrow }: { steps: Step[]; arrow: boolean }) {
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const top = useRef<HTMLElement>(null);
  const moved = useRef(false);

  // Keep the step title in view after moving on, not the button just pressed.
  useEffect(() => {
    if (moved.current) top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [i, done]);

  const go = (next: number) => {
    moved.current = true;
    setI(next);
  };
  const finish = (value: boolean) => {
    moved.current = true;
    setDone(value);
    if (!value) setI(0);
  };

  if (done) {
    return (
      <section
        ref={top}
        className="scroll-mt-20 rounded-[8px] border-2 border-stone2-900 bg-neon-500 p-6 shadow-[4px_4px_0_#0A0A0A]"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-stone2-900 bg-birch-50">
          <Check size={24} strokeWidth={3} />
        </span>
        <h2 className="mt-4 text-[28px] font-extrabold leading-[1.05] text-stone2-900">
          That&apos;s it.
        </h2>
        <p className="mt-2 text-[16px] leading-relaxed text-stone2-900">
          Open Around the Bean from your home screen. Sign in once and your usuals will be waiting.
        </p>
        <button
          type="button"
          onClick={() => finish(false)}
          className="tap-target mt-4 text-[14px] font-semibold text-stone2-900 underline underline-offset-4"
        >
          Show the steps again
        </button>
      </section>
    );
  }

  const step = steps[i];
  const last = i === steps.length - 1;

  return (
    <section
      ref={top}
      aria-live="polite"
      className="scroll-mt-20 rounded-[8px] border-2 border-stone2-900 bg-birch-50 p-5 shadow-[4px_4px_0_#0A0A0A]"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-forest-700">
          Step {i + 1} of {steps.length}
        </p>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {steps.map((_, k) => (
            <span
              key={k}
              className={`h-2.5 rounded-full border-2 border-stone2-900 transition-all duration-300 ${
                k === i ? 'w-7 bg-neon-500' : k < i ? 'w-2.5 bg-stone2-900' : 'w-2.5 bg-birch-50'
              }`}
            />
          ))}
        </div>
      </div>

      <h2 className="text-balance text-[28px] font-extrabold leading-[1.05] text-stone2-900">
        {step.title}
      </h2>
      <p className="mt-2 text-[16px] leading-relaxed text-stone2-600">{step.detail}</p>

      <div className="my-6">
        <PhoneDemo key={step.scene} scene={step.scene} />
      </div>

      <button
        type="button"
        onClick={() => (last ? finish(true) : go(i + 1))}
        className="btn tap-target w-full justify-center py-4 text-[17px]"
      >
        {last ? "Done, it's on my home screen" : 'Done, next step'}
        <ArrowRight size={18} />
      </button>
      {i > 0 && (
        <button
          type="button"
          onClick={() => go(i - 1)}
          className="tap-target mt-2 w-full py-2 text-[14px] font-semibold text-stone2-600 underline underline-offset-4"
        >
          Back
        </button>
      )}

      {arrow && i === 0 && (
        // Safari's Share button lives in the bottom toolbar on iPhone, below our own tab bar.
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-1 pb-safe md:hidden"
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
    </section>
  );
}

/**
 * The page every QR code points to.
 *
 * It works out where the person is and shows only what applies there: one
 * button on Android, a guided walk-through on iPhone, "open this in your
 * browser" inside Instagram or TikTok, and nothing to do if already installed.
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
    <div className="mx-auto max-w-md px-5 pb-40 pt-8 md:pt-16">
      <div className="mb-6 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- static app icon */}
        <img
          src="/icons/icon-192.png"
          alt=""
          className="h-[64px] w-[64px] shrink-0 rounded-[15px] border-2 border-stone2-900 shadow-[3px_3px_0_#0A0A0A]"
        />
        <div>
          <p className="text-[12px] uppercase tracking-[0.2em] text-forest-700">
            Around the Bean app
          </p>
          <h1 className="text-balance text-[28px] font-extrabold leading-[1.02] text-stone2-900">
            Your coffee, one tap away.
          </h1>
        </div>
      </div>

      <ul className="mb-7 flex flex-col gap-2.5">
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
            className="btn tap-target w-full justify-center py-4 text-[17px]"
          >
            <Download size={18} />
            Install Around the Bean
          </button>
          <p className="mt-3 text-center text-[13px] text-stone2-600">
            Free, no app store. Your phone asks once to confirm.
          </p>
        </section>
      )}

      {ctx && STEPS[ctx] && <Stepper steps={STEPS[ctx]!} arrow={ctx === 'ios-safari' && iphone} />}

      {ctx === 'in-app' && (
        <section className="flex flex-col gap-3">
          <div className="rounded-[8px] border-2 border-stone2-900 bg-birch-50 p-5 shadow-[4px_4px_0_#0A0A0A]">
            <h2 className="text-[24px] font-extrabold leading-[1.05] text-stone2-900">
              Open this page in your browser first
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-stone2-600">
              Instagram, TikTok and similar apps open links in their own browser, which cannot add
              apps to your home screen. Tap ⋯ and choose Open in browser, or copy the link.
            </p>
          </div>
          {android && (
            <a
              href={`intent://${typeof location === 'undefined' ? '' : location.host + location.pathname + location.search}#Intent;scheme=https;package=com.android.chrome;end`}
              className="btn tap-target justify-center py-4 text-[16px]"
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
            className="btn tap-target justify-center py-4 text-[16px]"
          >
            <Copy size={17} />
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

      {ctx && ctx !== 'installed' && ctx !== 'desktop' && (
        <p className="mt-6 text-center text-[14px] leading-relaxed text-stone2-600">
          Stuck? Ask us at the counter and we&apos;ll set it up with you.
        </p>
      )}
    </div>
  );
}
