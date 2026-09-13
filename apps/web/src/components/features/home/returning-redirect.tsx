'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Someone with an account did not open the site to read the café's story
 * again. They came for their coffee.
 *
 * So the first time they land on the front page in a browser session, they go
 * straight to their usuals. Only the first time: if they tap the logo later to
 * look at the front page, the front page is what they get. Signing in from the
 * front page counts as that first time too.
 */
export function ReturningRedirect() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    const key = `atb:usuals-shown:${user?.email ?? 'me'}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Without storage there is no way to remember it happened, and a front
      // page that always bounces you away is worse than no redirect at all.
      return;
    }
    router.replace('/order');
  }, [isAuthenticated, user?.email, router]);

  return null;
}
