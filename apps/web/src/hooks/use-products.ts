'use client';

import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';

export function useProducts(categoryId?: string) {
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: () => productsApi.list(categoryId),
    staleTime: 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: productsApi.categories,
    staleTime: 5 * 60 * 1000,
  });
}
