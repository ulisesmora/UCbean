'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';

export function useMe() {
  const { accessToken, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(accessToken!),
    enabled: isAuthenticated && !!accessToken,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      qc.clear();
    },
  });
}
