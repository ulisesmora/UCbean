import Link from 'next/link';
import { ArrowRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { LeafLogo } from '@/components/layout/header';

const LINKS: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: 'Order',
    items: [
      { href: '/menu', label: 'Menu' },
      { href: '/build', label: 'Build your own' },
      { href: '/pickup', label: 'Order & Pickup' },
      { href: '/order', label: 'Your usuals' },
    ],
  },
  {
    title: 'Visit',
    items: [
      { href: '/about', label: 'Our story' },
      { href: '/table', label: 'Reserve a table' },
      { href: '/events', label: 'Events' },
    ],
  },
  {
    title: 'You',
    items: [
      { href: '/rewards', label: 'Rewards' },
      { href: '/profile', label: 'Account' },
    ],
  },
];

/**
 * The foot of every page.
 *
 * What someone scrolling to the bottom is usually after: when the café is
 * open, where it is, how to reach it, and a way to order without scrolling
 * back up. Only details the site already states; nothing invented.
 *
 * On phones it clears the fixed tab bar, so the last line is never hidden
 * behind it.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-2 border-stone2-900 bg-stone2-900 text-birch-50">
      <div className="mx-auto max-w-6xl px-6 pb-28 pt-14 md:pb-10 md:pt-16">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          {/* Brand and the one thing to do next */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="rounded-full bg-birch-50 p-1">
                <LeafLogo />
              </span>
              <span className="leading-tight">
                <span className="block text-[18px] font-semibold tracking-tight">
                  Around the Bean
                </span>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-birch-50/60">
                  · UBC Vancouver ·
                </span>
              </span>
            </Link>

            <p className="mt-6 max-w-sm font-seal text-[22px] leading-snug">
              A family coffee shop at the edge of campus, since 2018.
            </p>

            <Link href="/menu" className="btn btn-acid mt-6 inline-flex px-6 py-3 text-[14px]">
              Order ahead
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Where to go on the site */}
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-4">
            {LINKS.map((group) => (
              <div key={group.title}>
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-neon-500">
                  {group.title}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-[14px] text-birch-50/80 underline-offset-4 transition-colors hover:text-birch-50 hover:underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* When and where */}
          <div className="md:col-span-3">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-neon-500">
              Find us
            </p>
            <ul className="flex flex-col gap-3 text-[14px] text-birch-50/80">
              <li className="flex items-start gap-2.5">
                <Clock size={15} className="mt-0.5 shrink-0 text-birch-50/60" />
                <span>
                  Open daily
                  <span className="block font-mono tabular-nums text-birch-50">7am – 7pm</span>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0 text-birch-50/60" />
                <span>UBC Vancouver</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={15} className="mt-0.5 shrink-0 text-birch-50/60" />
                <a
                  href="mailto:events@aroundthebean.ca"
                  className="break-all underline-offset-4 hover:text-birch-50 hover:underline"
                >
                  events@aroundthebean.ca
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone size={15} className="mt-0.5 shrink-0 text-birch-50/60" />
                <a
                  href="tel:+16041234567"
                  className="font-mono tabular-nums underline-offset-4 hover:text-birch-50 hover:underline"
                >
                  +1 (604) 123-4567
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-birch-50/15 pt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-birch-50/55">
          <span>© {year} Around the Bean</span>
          <span>Family owned · Est. 2018</span>
        </div>
      </div>
    </footer>
  );
}
