'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

function LeafLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="13" stroke="#2d5235" strokeWidth="1.4"/>
      <ellipse cx="15" cy="15" rx="6" ry="13" stroke="#2d5235" strokeWidth="1.4"/>
      <line x1="2" y1="10.5" x2="28" y2="10.5" stroke="#2d5235" strokeWidth="1.4"/>
      <line x1="2" y1="19.5" x2="28" y2="19.5" stroke="#2d5235" strokeWidth="1.4"/>
    </svg>
  )
}

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className={cn(
      'sticky top-0 z-40 transition-all duration-300',
      scrolled
        ? 'bg-birch-50/95 backdrop-blur-md border-b border-birch-200 shadow-sm'
        : 'bg-birch-50',
    )}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <LeafLogo />
          <div className="leading-tight">
            <p className="font-body font-bold text-[15px] text-stone2-900 tracking-tight">
              Around the Bean
            </p>
            <p className="text-[9px] font-semibold tracking-[0.18em] text-forest-600 uppercase">
              · UBC Vancouver ·
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-[13px] font-semibold text-stone2-600">
          <Link href="/menu"   className="hover:text-stone2-900 transition-colors">Menu</Link>
          <Link href="/pickup" className="hover:text-stone2-900 transition-colors">Order & Pickup</Link>
          <Link href="/table"  className="hover:text-stone2-900 transition-colors">Reserve</Link>
          <Link href="/events" className="hover:text-stone2-900 transition-colors">Events</Link>
          <Link href="/about"  className="hover:text-stone2-900 transition-colors">Visit</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="hidden md:inline-flex items-center px-4 py-1.5 rounded-full border border-forest-700 text-forest-700 text-xs font-semibold hover:bg-forest-50 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/order"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 transition-colors tap-target"
          >
            <ShoppingBag size={14} />
            <span className="hidden sm:inline">Order now</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
