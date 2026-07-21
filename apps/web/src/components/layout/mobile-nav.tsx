'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, Clock, CalendarDays, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/',        label: 'Home',    icon: Home },
  { href: '/menu',    label: 'Menu',    icon: UtensilsCrossed },
  { href: '/pickup',  label: 'Pickup',  icon: Clock },
  { href: '/table',   label: 'Reserve', icon: CalendarDays },
  { href: '/profile', label: 'Account', icon: User },
]

export function MobileNav() {
  const path = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-birch-50/98 backdrop-blur-xl border-t border-birch-200 pb-safe">
      <div className="grid grid-cols-5 h-16">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors tap-target',
                active ? 'text-forest-700' : 'text-stone2-400 hover:text-stone2-600',
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
