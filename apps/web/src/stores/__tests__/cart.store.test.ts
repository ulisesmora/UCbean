import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useCartStore } from '../cart.store';
import type { Product } from '@/types/api.types';

const makeProduct = (overrides?: Partial<Product>): Product => ({
  id: '1',
  name: 'Espresso',
  description: null,
  price: 3.5,
  imageUrl: null,
  isAvailable: true,
  categoryId: 'cat-1',
  ...overrides,
});

describe('cart store', () => {
  beforeEach(() => {
    act(() => {
      useCartStore.getState().clearCart();
    });
  });

  it('adds a new item', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct());
    });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().totalItems()).toBe(1);
  });

  it('increments qty when adding an existing item', () => {
    const p = makeProduct();
    act(() => {
      useCartStore.getState().addItem(p);
      useCartStore.getState().addItem(p);
    });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].qty).toBe(2);
  });

  it('removes an item', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct());
      useCartStore.getState().removeItem('1');
    });
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('updateQty to 0 removes the item', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct());
      useCartStore.getState().updateQty('1', 0);
    });
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('calculates total price correctly', () => {
    act(() => {
      useCartStore.getState().addItem(makeProduct({ price: 4.0 }));
      useCartStore.getState().addItem(makeProduct({ id: '2', price: 5.5 }));
      useCartStore.getState().updateQty('1', 3);
    });
    // 3 * 4.0 + 1 * 5.5 = 12 + 5.5 = 17.5
    expect(useCartStore.getState().totalPrice()).toBeCloseTo(17.5);
  });

  it('toggles cart open/close', () => {
    expect(useCartStore.getState().isOpen).toBe(false);
    act(() => {
      useCartStore.getState().toggleCart();
    });
    expect(useCartStore.getState().isOpen).toBe(true);
  });
});
