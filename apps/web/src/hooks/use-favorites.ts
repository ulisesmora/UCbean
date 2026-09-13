'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoritesApi, productsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import type { FavoriteDrink } from '@/types/api.types';

/**
 * «Lo de siempre».
 *
 * Guardar una bebida es lo que convierte diez pasos de configurador en un
 * toque. La lista viene del servidor ordenada por lo que más se pide, que es
 * lo que casi siempre se quiere repetir.
 */
export function useFavorites() {
  const { accessToken, isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.mine(accessToken!),
    enabled: isAuthenticated && !!accessToken,
  });
}

export function useSaveFavorite() {
  const { accessToken } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; build: unknown; recipeId?: string; productId?: string }) =>
      favoritesApi.save(body, accessToken!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}

export function useRemoveFavorite() {
  const { accessToken } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => favoritesApi.remove(id, accessToken!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}

/**
 * Volver a pedir una guardada.
 *
 * La favorita guarda el id del producto, no el producto: el precio, la foto y
 * si sigue a la venta los pone el catálogo de hoy. Por eso hay que buscarlo
 * antes de meterlo al carrito.
 */
export function useReorderFavorite() {
  const { accessToken } = useAuthStore();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  return useMutation({
    mutationFn: async (fav: FavoriteDrink) => {
      const products = await productsApi.list();
      const product = fav.productId
        ? products.find((p) => p.id === fav.productId)
        : products.find((p) => p.isAvailable);
      if (!product) throw new Error('That drink is not on the menu right now');

      addItem(product, { build: fav.build, recipeId: fav.recipeId ?? undefined, label: fav.name });
      // El contador es lo que ordena la lista. Si falla no pasa nada: la
      // bebida ya está en el carrito, que es lo que se pidió.
      await favoritesApi.markOrdered(fav.id, accessToken!).catch(() => undefined);
      openCart();
    },
  });
}
