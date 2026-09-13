'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';
import { CartButton } from '@/components/features/cart/cart-sheet';
import { AuthModal } from '@/components/features/auth/auth-modal';
import { CartSheet } from '@/components/features/cart/cart-sheet';
import { User } from 'lucide-react';
import { toast } from 'sonner';

export function LeafLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="13" stroke="#0A0A0A" strokeWidth="1.4" />
      <ellipse cx="15" cy="15" rx="6" ry="13" stroke="#0A0A0A" strokeWidth="1.4" />
      <line x1="2" y1="10.5" x2="28" y2="10.5" stroke="#0A0A0A" strokeWidth="1.4" />
      <line x1="2" y1="19.5" x2="28" y2="19.5" stroke="#0A0A0A" strokeWidth="1.4" />
    </svg>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const logout = useLogout();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => toast.success('Signed out'),
      onError: () => {
        // Clear local state even if API call fails
        useAuthStore.getState().clearAuth();
      },
    });
  }

  return (
    <>
      <header
        className={cn(
          'glass-bar sticky top-0 z-40 border-b-2 border-stone2-900 transition-shadow duration-300',
          scrolled && 'shadow-[0_10px_30px_-24px_rgba(10,10,10,0.7)]',
        )}
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <LeafLogo />
            <div className="leading-tight">
              <p className="text-[15px] font-semibold tracking-tight text-stone2-900">
                Around the Bean
              </p>
              <p className="text-[9px] uppercase tracking-[0.18em] text-stone2-400">
                · UBC Vancouver ·
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 text-[14px] text-stone2-600 md:flex">
            {isAuthenticated && (
              <Link
                href="/order"
                className="font-semibold text-stone2-900 transition-colors hover:text-forest-700"
              >
                Your usuals
              </Link>
            )}
            <Link href="/menu" className="transition-colors hover:text-stone2-900">
              Menu
            </Link>
            <Link href="/pickup" className="transition-colors hover:text-stone2-900">
              Order &amp; Pickup
            </Link>
            <Link href="/table" className="transition-colors hover:text-stone2-900">
              Reserve
            </Link>
            <Link href="/about" className="transition-colors hover:text-stone2-900">
              Visit
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/profile" className="btn px-4 py-2 text-[13px]">
                  <User size={13} />
                  {user?.name?.split(' ')[0]}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-2 text-[13px] text-stone2-400 transition-colors hover:text-stone2-600"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="btn hidden px-5 py-2 text-[13px] md:inline-flex"
              >
                Sign in
              </button>
            )}
            <CartButton />
          </div>
        </div>
      </header>

      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
      <CartSheet />
    </>
  );
}
