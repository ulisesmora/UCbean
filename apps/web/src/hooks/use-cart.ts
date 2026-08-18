'use client';

import { useMutation } from '@tanstack/react-query';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import type { Order } from '@/types/api.types';

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

function mockCreateOrder(
  orderType: 'PICKUP' | 'TABLE' | 'DELIVERY',
  items: { productId: string; qty: number }[],
): Promise<Order> {
  return new Promise((res) =>
    setTimeout(
      () =>
        res({
          id: 'order-mock-' + Date.now(),
          userId: 'mock-user-1',
          type: orderType,
          status: 'CONFIRMED',
          total: 0,
          notes: null,
          items: items.map((i) => ({
            productId: i.productId,
            productName: 'Item',
            qty: i.qty,
            unitPrice: 0,
            subtotal: 0,
          })),
          createdAt: new Date().toISOString(),
        }),
      600,
    ),
  );
}

export { useCartStore };

export function useCheckout() {
  const { items, clearCart } = useCartStore();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: (orderType: 'PICKUP' | 'TABLE' | 'DELIVERY') => {
      const payload = items.map((i) => ({ productId: i.product.id, qty: i.qty }));
      if (USE_MOCKS) return mockCreateOrder(orderType, payload);
      return api.post<Order>(
        '/orders',
        { type: orderType, items: payload },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    },
    onSuccess: () => {
      clearCart();
    },
  });
}
