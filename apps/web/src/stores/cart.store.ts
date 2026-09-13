'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { describe, priceOf, EXTRAS, type Build } from '@/lib/builder';
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
  /** Añadidos sobre un producto de carta. Se cobran encima de su precio. */
  extras?: string[];
  /** Lo que el cliente pidió a mano: «extra caliente», «para llevar». */
  note?: string;
  /** For here or to go, on a menu item. A built drink carries it in its build. */
  vessel?: 'here' | 'togo';
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
function lineIdFor(
  productId: string,
  build?: Build,
  extras?: string[],
  note?: string,
  vessel?: string,
): string {
  if (!build) {
    // Sin fórmula, lo que distingue una línea de otra son los añadidos y la
    // nota: dos flat whites, uno con canela, son dos bebidas distintas que
    // preparar aunque salgan de la misma fila del catálogo.
    const sufijo = [[...(extras ?? [])].sort().join('+'), note ?? '', vessel ?? '']
      .filter(Boolean)
      .join('|');
    return sufijo ? `${productId}:${sufijo}` : productId;
  }
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
    options?: {
      build?: Build;
      recipeId?: string;
      label?: string;
      extras?: string[];
      note?: string;
      vessel?: 'here' | 'togo';
    },
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
          const { build, recipeId, label, extras, note, vessel } = options ?? {};
          const lineId = lineIdFor(product.id, build, extras, note, build ? undefined : vessel);
          const existing = state.items.find((i) => i.lineId === lineId);
          if (existing) {
            return {
              items: state.items.map((i) => (i.lineId === lineId ? { ...i, qty: i.qty + 1 } : i)),
            };
          }
          // Lo que suman los extras, con los mismos precios que cobra el
          // servidor. Si aquí saliera otro número, el carrito mentiría.
          const anadido = (extras ?? []).reduce(
            (sum, id) => sum + (EXTRAS.find((e) => e.id === id)?.price ?? 0),
            0,
          );

          const line: CartItem = {
            lineId,
            product,
            qty: 1,
            build,
            extras: extras?.length ? extras : undefined,
            note,
            vessel: build ? undefined : vessel,
            recipeId,
            label: label ?? product.name,
            // What the bar reads: the extras, then whether it stays or goes.
            ticket: build
              ? describe(build)
              : [
                  ...EXTRAS.filter((e) => extras?.includes(e.id)).map((e) => e.name.toLowerCase()),
                  ...(vessel ? [vessel === 'here' ? 'for here' : 'to go'] : []),
                ].join(', ') || undefined,
            // A built drink is priced by its formula; a bag of beans by the
            // shelf, más lo que se le haya añadido encima.
            price: build ? priceOf(build) : Math.round((product.price + anadido) * 100) / 100,
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
      // Sube cada vez que cambia la forma de una línea. Ahora llevan extras
      // y nota, y su id se calcula distinto: un carrito viejo no los tiene y
      // preferimos empezarlo vacío antes que adivinarlos.
      version: 3,
      migrate: () => ({ items: [] }),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
