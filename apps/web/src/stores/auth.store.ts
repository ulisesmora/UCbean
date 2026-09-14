'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/api.types';
import { isTokenExpired } from '@/lib/jwt';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),

      clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),

      setUser: (user) => set({ user }),
    }),
    {
      name: 'ucbean-auth',
      // Only persist the token and minimal user info — not the full state
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // A session saved last month must not come back as signed in.
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && isTokenExpired(state.accessToken)) state.clearAuth();
      },
    },
  ),
);
