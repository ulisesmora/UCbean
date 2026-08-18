import type { Metadata } from 'next';
import { MenuClient } from './menu-client';

export const metadata: Metadata = { title: 'Menu' };

export default function MenuPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 py-12 md:py-16">
      <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-2">
        What we brew
      </p>
      <h1 className="font-body font-extrabold text-4xl md:text-5xl text-stone2-900 mb-2">
        The Menu
      </h1>
      <p className="text-stone2-600 text-[15px] mb-10 max-w-lg">
        Single-origin beans, Korean-inspired drinks, and seasonal specials. Everything is made to
        order.
      </p>

      <MenuClient />
    </div>
  );
}
