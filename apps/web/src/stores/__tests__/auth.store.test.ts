import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useAuthStore } from '../auth.store';
import type { User } from '@/types/api.types';

const makeUser = (): User => ({
  id: 'u1',
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  role: 'CUSTOMER',
});

describe('auth store', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.getState().clearAuth();
    });
  });

  it('starts unauthenticated', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('setAuth sets user and token', () => {
    act(() => {
      useAuthStore.getState().setAuth(makeUser(), 'tok123');
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('test@example.com');
    expect(useAuthStore.getState().accessToken).toBe('tok123');
  });

  it('clearAuth resets state', () => {
    act(() => {
      useAuthStore.getState().setAuth(makeUser(), 'tok123');
      useAuthStore.getState().clearAuth();
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
