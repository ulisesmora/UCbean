'use client';

import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ordersApi, productsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import type { Build } from '@/lib/builder';
import type { Order } from '@/types/api.types';

/**
 * Los estados en los que un pedido todavía le importa al cliente.
 *
 * COMPLETED y CANCELLED no están: uno ya se lo bebió y el otro no llegó a
 * existir. Enseñar cualquiera de los dos como «en marcha» sería mentir.
 */
export const EN_CURSO: Order['status'][] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'];

/** El último pedido, que es el que casi siempre se quiere repetir. */
export function useLastOrder() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.myOrders(accessToken!),
    enabled: isAuthenticated && !!accessToken,
  });

  // La API los devuelve del más nuevo al más viejo, pero no se confía en el
  // orden: si algún día cambia, esto seguiría eligiendo bien.
  const last = (data ?? [])
    .slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];

  return { last, isLoading };
}

/**
 * «Lo mismo de la última vez».
 *
 * Copia las líneas de un pedido al carrito. El producto se vuelve a buscar
 * en el catálogo de hoy en vez de reusar el del pedido viejo: así el precio
 * es el de hoy y una bebida retirada avisa en vez de colarse.
 */
export function useReorder() {
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);

  return useMutation({
    mutationFn: async (order: Order) => {
      const products = await productsApi.list();
      const porId = new Map(products.map((p) => [p.id, p]));

      const disponibles = order.items.filter((i) => porId.get(i.productId)?.isAvailable);
      if (disponibles.length === 0) {
        throw new Error('Nothing from that order is on the menu today');
      }

      // Se vacía primero para que repetir sea exactamente ese pedido y no una
      // mezcla con lo que quedara suelto de otra sesión.
      clearCart();
      for (const linea of disponibles) {
        const product = porId.get(linea.productId)!;
        for (let n = 0; n < linea.qty; n++) {
          addItem(product, {
            build: (linea.build as Build) ?? undefined,
            recipeId: linea.recipeId ?? undefined,
            label: linea.name ?? linea.productName,
            extras: linea.extras?.length ? linea.extras : undefined,
          });
        }
      }

      return { added: disponibles.length, skipped: order.items.length - disponibles.length };
    },
  });
}

/**
 * Lo que sueles pedir a esta hora.
 *
 * Se calcula aquí, en el navegador, a partir del historial que ya se
 * descargó. No se guarda ningún perfil de hábitos en el servidor ni se
 * registra que lo miraste: si mañana dejas de venir a las nueve, esto deja
 * de existir solo.
 *
 * La franja es de más o menos dos horas porque nadie llega clavado: el café
 * de las nueve y el de las diez y media son el mismo café de la mañana.
 * Hacen falta al menos dos veces para llamarlo costumbre; con una es
 * casualidad.
 */
export function useHabit() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.myOrders(accessToken!),
    enabled: isAuthenticated && !!accessToken,
  });

  return useMemo(() => {
    const orders = data ?? [];
    if (orders.length < 2) return null;

    const ahora = new Date().getHours();
    const cuenta = new Map<string, number>();

    for (const o of orders) {
      if (o.status === 'CANCELLED') continue;
      const h = new Date(o.createdAt).getHours();
      if (Math.abs(h - ahora) > 2) continue;
      for (const i of o.items) {
        const nombre = i.name ?? i.productName;
        cuenta.set(nombre, (cuenta.get(nombre) ?? 0) + i.qty);
      }
    }

    const top = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0];
    return top && top[1] >= 2 ? { name: top[0], times: top[1] } : null;
  }, [data]);
}
