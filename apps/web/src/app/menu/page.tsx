import type { Metadata } from 'next';
import { MenuClient } from './menu-client';

export const metadata: Metadata = { title: 'Menu' };

export default function MenuPage() {
  return (
    <div className="bloom relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="mb-5 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-stone2-600">
          <span className="h-2.5 w-2.5 bg-neon-500 ring-1 ring-stone2-900" />
          What we brew
        </p>
        <h1 className="mb-5 text-4xl font-extrabold leading-[1.0] text-stone2-900 md:text-5xl">
          The <span className="marker font-seal italic">menu.</span>
        </h1>
        <p className="mb-12 max-w-lg text-[16px] leading-relaxed text-stone2-600">
          Single-origin beans, Korean-inspired drinks, and seasonal specials. Everything is made to
          order.
        </p>

        <MenuClient />
      </div>
    </div>
  );
}
