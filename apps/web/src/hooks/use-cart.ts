'use client';

import { useMutation } from '@tanstack/react-query';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import type { Order } from '@/types/api.types';

export { useCartStore };

export interface CheckoutInput {
  type: 'PICKUP' | 'TABLE' | 'DELIVERY';
  /** Collection day as YYYY-MM-DD and time as HH:MM. Both required for PICKUP. */
  date?: string;
  slot?: string;
  notes?: string;
  /** El servidor lo vuelve a comprobar y calcula el importe. */
  discountCode?: string;
  /** «Ahora mismo»: el servidor busca el primer hueco al que llega la barra. */
  asap?: boolean;
  /**
   * La llave de este intento de pedir.
   *
   * Si la petición se repite —doble toque, red lenta que reintenta, la
   * pestaña que se recarga a mitad— el servidor ve la misma llave y devuelve
   * el pedido que ya creó en vez de hacer otro. Es lo que impide cobrar dos
   * cafés por uno.
   */
  idempotencyKey: string;
}

/** Lo que devuelve el servidor al crear: el pedido, y si era uno repetido. */
export type PlacedOrder = Order & { replayed?: boolean };

/**
 * A date and a wall-clock time, as the instant the API expects.
 *
 * Built in local time on purpose. The times the customer picked are the café's
 * opening hours, and the café is in one place.
 */
function slotToIso(date: string, slot: string): string {
  const [h, m] = slot.split(':').map(Number);
  const when = new Date(`${date}T00:00:00`);
  when.setHours(h, m, 0, 0);
  return when.toISOString();
}

export function useCheckout() {
  const { items, clearCart } = useCartStore();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: ({ type, date, slot, notes, discountCode, asap, idempotencyKey }: CheckoutInput) =>
      api.post<PlacedOrder>(
        '/orders',
        {
          type,
          notes,
          discountCode,
          asap,
          slotTime: date && slot ? slotToIso(date, slot) : undefined,
          // The formula travels with the line, so the kitchen sees the same
          // drink the customer configured. Price is deliberately not sent:
          // the server reads it off the catalogue.
          items: items.map((i) => ({
            productId: i.product.id,
            qty: i.qty,
            build: i.build,
            // Los extras viajan aparte de la fórmula: el servidor los cobra
            // encima del precio de carta en vez de recalcular la bebida.
            extras: i.extras,
            vessel: i.vessel,
            recipeId: i.recipeId,
            name: i.label,
            ticket: i.ticket,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            // En cabecera y no en el cuerpo, igual que Stripe: describe el
            // intento, no el pedido.
            'Idempotency-Key': idempotencyKey,
          },
        },
      ),
    onSuccess: () => {
      clearCart();
    },
  });
}
