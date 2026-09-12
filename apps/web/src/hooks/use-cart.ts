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
}

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
    mutationFn: ({ type, date, slot, notes }: CheckoutInput) =>
      api.post<Order>(
        '/orders',
        {
          type,
          notes,
          slotTime: date && slot ? slotToIso(date, slot) : undefined,
          // The formula travels with the line, so the kitchen sees the same
          // drink the customer configured. Price is deliberately not sent:
          // the server reads it off the catalogue.
          items: items.map((i) => ({
            productId: i.product.id,
            qty: i.qty,
            build: i.build,
            recipeId: i.recipeId,
            name: i.label,
            ticket: i.ticket,
          })),
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
    onSuccess: () => {
      clearCart();
    },
  });
}
