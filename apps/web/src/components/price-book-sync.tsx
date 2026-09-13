'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { drinksApi } from '@/lib/api';
import { applyPriceBook, usePriceBook } from '@/lib/price-book';

/**
 * Loads component prices once per visit and puts them on the builder's lists.
 * Renders nothing. Mounted once, in the app providers.
 */
export function PriceBookSync() {
  const { data } = useQuery({
    queryKey: ['drinks', 'options'],
    queryFn: drinksApi.options,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (data && applyPriceBook(data)) {
      usePriceBook.setState((s) => ({ version: s.version + 1 }));
    }
  }, [data]);

  return null;
}
