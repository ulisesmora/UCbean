'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  currentContext,
  promptInstall,
  useInstallPrompt,
  type InstallContext,
} from '@/lib/install';

/** Which install context applies here, or null until mounted. */
function useInstallContext(): InstallContext | null {
  const event = useInstallPrompt((s) => s.event);
  const installed = useInstallPrompt((s) => s.installed);
  const [ctx, setCtx] = useState<InstallContext | null>(null);
  useEffect(() => setCtx(installed ? 'installed' : currentContext()), [event, installed]);
  return ctx;
}

async function install() {
  if (await promptInstall())
    toast.success('Installed. Open Around the Bean from your home screen.');
}

/**
 * "Skip the wait next time", on the order tracker.
 *
 * Right after paying is when the app makes sense: the person is waiting for a
 * coffee and would like to be told when it is ready.
 */
export function InstallInvite({ source, className = '' }: { source: string; className?: string }) {
  const ctx = useInstallContext();
  if (!ctx || ctx === 'installed' || ctx === 'desktop') return null;

  return (
    <div
      className={`rounded-[6px] border-2 border-stone2-900 bg-birch-50 p-4 shadow-[3px_3px_0_#0A0A0A] ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- static app icon */}
        <img
          src="/icons/icon-192.png"
          alt=""
          className="h-11 w-11 shrink-0 rounded-[10px] border-2 border-stone2-900"
        />
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-tight text-stone2-900">
            Skip the wait next time
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-stone2-600">
            Add Around the Bean to your home screen: your usuals in one tap, a ping when it is
            ready, and +50 points the first time you open it.
          </p>
        </div>
      </div>
      {ctx === 'prompt' ? (
        <button
          type="button"
          onClick={install}
          className="btn tap-target mt-3 w-full justify-center py-2.5 text-[14px]"
        >
          <Download size={15} />
          Install the app
        </button>
      ) : (
        <Link
          href={`/app?src=${source}`}
          className="btn tap-target mt-3 w-full justify-center py-2.5 text-[14px]"
        >
          Show me how, it takes 10 seconds
        </Link>
      )}
    </div>
  );
}

const VISITS = 'atb:visits';
const COUNTED = 'atb:visit-counted';
const SNOOZE = 'atb:install-banner-snooze';
const THIRTY_DAYS = 30 * 24 * 3600 * 1000;

/**
 * A slim bar on phones, from the second visit on.
 *
 * Nobody installs anything on a first visit to a café's site. Someone who
 * came back is a regular, and closing it hides it for a month.
 */
export function InstallBanner() {
  const path = usePathname();
  const ctx = useInstallContext();
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(COUNTED)) {
        sessionStorage.setItem(COUNTED, '1');
        localStorage.setItem(VISITS, String(Number(localStorage.getItem(VISITS) || 0) + 1));
      }
      const visits = Number(localStorage.getItem(VISITS) || 0);
      const snoozed = Number(localStorage.getItem(SNOOZE) || 0) > Date.now();
      setEligible(visits >= 2 && !snoozed && window.matchMedia('(max-width: 767px)').matches);
    } catch {
      setEligible(false);
    }
  }, []);

  if (!eligible || !ctx || ctx === 'installed' || ctx === 'desktop' || path === '/app') return null;

  const snooze = () => {
    try {
      localStorage.setItem(SNOOZE, String(Date.now() + THIRTY_DAYS));
    } catch {
      // Hidden for this visit only.
    }
    setEligible(false);
  };

  return (
    <div
      role="region"
      aria-label="Get the app"
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 rounded-[6px] border-2 border-stone2-900 bg-birch-50 p-2.5 shadow-[3px_3px_0_#0A0A0A] md:hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static app icon */}
      <img
        src="/icons/icon-192.png"
        alt=""
        className="h-10 w-10 shrink-0 rounded-[9px] border-2 border-stone2-900"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold leading-tight text-stone2-900">Get the app</p>
        <p className="truncate text-[12px] text-stone2-600">A ping when it is ready. +50 points.</p>
      </div>
      {ctx === 'prompt' ? (
        <button type="button" onClick={install} className="btn tap-target px-3.5 py-2 text-[13px]">
          Install
        </button>
      ) : (
        <Link href="/app?src=banner" className="btn tap-target px-3.5 py-2 text-[13px]">
          Add
        </Link>
      )}
      <button
        type="button"
        onClick={snooze}
        aria-label="Not now"
        className="tap-target flex items-center justify-center p-1.5 text-stone2-400 hover:text-stone2-900"
      >
        <X size={16} />
      </button>
    </div>
  );
}
