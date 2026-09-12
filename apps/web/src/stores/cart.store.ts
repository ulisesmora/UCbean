'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { describe, priceOf, type Build } from '@/lib/builder';
import type { Product } from '@/types/api.types';

/**
 * One line on the ticket.
 *
 * A line is a product plus, optionally, the formula it was built with. Two oat
 * lattes are the same line only if they were made the same way, which is why
 * lines are keyed by `lineId` rather than by product: one heart, one rosetta,
 * two lines, two drinks to make.
 *
 * `product` stays on every line because the API needs the catalogue id for the
 * order row, and the catalogue is what sets the price.
 */
export interface CartItem {
  lineId: string;
  product: Product;
  qty: number;
  /** How this one is made. Absent for a bag of beans or a pastry. */
  build?: Build;
  /** The menu recipe it came from, absent when the customer built it. */
  recipeId?: string;
  /** What to show on the line, and on the ticket in the kitchen. */
  label: string;
  ticket?: string;
  /** Unit price, which for a build includes size and extras. */
  price: number;
}

/**
 * Identity of a line.
 *
 * The build is serialised in a fixed key order so that the same choices always
 * produce the same id, whichever order the customer made them in. Extras are
 * sorted for the same reason: sugar then cinnamon is the same drink as
 * cinnamon then sugar.
 */
function lineIdFor(productId: string, build?: Build): string {
  if (!build) return productId;
  const parts = [
    build.beans,
    build.size,
    build.base,
    build.serve,
    build.milk,
    build.foam,
    build.art,
    build.vessel,
    build.sleeve,
    [...build.extras].sort().join('+'),
  ];
  return `${productId}:${parts.join('|')}`;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  /** Add a plain catalogue item, or the same product built a particular way. */
  addItem: (
    product: Product,
    options?: { build?: Build; recipeId?: string; label?: string },
  ) => void;
  removeItem: (lineId: string) => void;
  updateQty: (lineId: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Derived
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, options) =>
        set((state) => {
          const { build, recipeId, label } = options ?? {};
          const lineId = lineIdFor(product.id, build);
          const existing = state.items.find((i) => i.lineId === lineId);
          if (existing) {
            return {
              items: state.items.map((i) => (i.lineId === lineId ? { ...i, qty: i.qty + 1 } : i)),
            };
          }
          const line: CartItem = {
            lineId,
            product,
            qty: 1,
            build,
            recipeId,
            label: label ?? product.name,
            ticket: build ? describe(build) : undefined,
            // A built drink is priced by its formula; a bag of beans by the shelf.
            price: build ? priceOf(build) : product.price,
          };
          return { items: [...state.items, line] };
        }),

      removeItem: (lineId) =>
        set((state) => ({
          items: state.items.filter((i) => i.lineId !== lineId),
        })),

      updateQty: (lineId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.lineId !== lineId)
              : state.items.map((i) => (i.lineId === lineId ? { ...i, qty } : i)),
        })),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    {
      name: 'ucbean-cart',
      // Bumped because lines gained an id and a price of their own. An old
      // basket has neither, and rather than guess at them we start it empty.
      version: 2,
      migrate: () => ({ items: [] }),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
