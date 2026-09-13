'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Photo } from '@/components/ui/photo';
import { DEFAULT_BUILD, priceOf } from '@/lib/builder';

/** The catalogue row the configurator orders against. It is not picked off a shelf. */
export const BUILD_OWN = /build your own/i;

/**
 * Build your own, recommended inside the menu.
 *
 * It goes first because it is the order that earns most per cup: size, milk,
 * foam, art and extras each add to the ticket, and people choose more of them
 * when they watch the drink being made. Two columns wide, so it reads as a
 * recommendation and not as one more item in the grid.
 */
export function BuildYourOwnCard() {
  const from = priceOf({ ...DEFAULT_BUILD, size: 'small', milk: 'whole', art: 'none', extras: [] });

  return (
    <Link
      href="/build"
      className="glass glass-edge glass-hover group flex flex-col overflow-hidden sm:col-span-2 md:flex-row"
    >
      <Photo
        src="espresso-pull.jpg"
        label="Build your own"
        alt="An espresso being pulled at the bar"
        className="aspect-[4/3] w-full border-b-2 border-stone2-900 md:aspect-auto md:min-h-[260px] md:w-1/2 md:border-b-0 md:border-r-2"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 md:p-6">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-700">
          <Sparkles size={13} />
          Recommended
        </p>
        <h3 className="font-seal text-[30px] leading-tight text-stone2-900">Build your own.</h3>
        <p className="text-[14px] leading-relaxed text-stone2-600">
          Pick the beans, size, milk and foam, pour the latte art and choose your cup. You watch it
          being made in 3D before you order.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {['4 beans', '6 drinks', '4 milks', '5 latte arts', 'Extras'].map((t) => (
            <span
              key={t}
              className="rounded-full border-2 border-stone2-900 px-2.5 py-0.5 text-[12px] font-semibold text-stone2-900"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="font-mono text-[15px] font-bold tabular-nums text-stone2-900">
            From ${from.toFixed(2)}
          </span>
          <span className="btn btn-acid px-5 py-2.5 text-[14px]">
            Start building
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
