'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Coffee, Home, UtensilsCrossed, Clock, Sparkles, User } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

/**
 * Cinco pestañas, que es el tope antes de que dejen de leerse.
 *
 * Reservar mesa sale de aquí y se queda en la cabecera: en móvil compite por
 * un hueco con lo que la gente hace a diario, que es pedir y recoger. Vuelve
 * el día que la reserva de mesas sea una prioridad.
 */
const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/pickup', label: 'Pickup', icon: Clock },
  { href: '/rewards', label: 'Rewards', icon: Sparkles },
  { href: '/profile', label: 'Account', icon: User },
];

export function MobileNav() {
  const path = usePathname();
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  // The session lives in localStorage. Until mount, server and client have to
  // draw the same bar or hydration breaks.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Signed in, the first tab is where you order your usual, not the café's
  // front page. The front page is still one tap away on the logo.
  const tabs =
    mounted && signedIn
      ? [{ href: '/order', label: 'Order', icon: Coffee }, ...TABS.slice(1)]
      : TABS;
  return (
    <nav className="glass-bar pb-safe fixed inset-x-0 bottom-0 z-50 border-x-0 border-b-0 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors tap-target',
                active ? 'text-neon-500' : 'text-stone2-400 hover:text-stone2-600',
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
