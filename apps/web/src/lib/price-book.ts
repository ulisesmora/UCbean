import { create } from 'zustand';
import {
  ARTS,
  BASES,
  BEANS,
  EXTRAS,
  FOAMS,
  MILKS,
  SERVES,
  SIZES,
  VESSELS,
  priceOf,
  type Build,
} from './builder';

/**
 * Component prices, as the counter app set them.
 *
 * The builder's option lists carry default prices so the site renders at once.
 * The API owns the real prices, so they are fetched once and written onto
 * those same lists: every running total, the dialog and the bag then show
 * exactly what an order will be charged.
 *
 * ponytail: mutating the shared lists keeps every priceOf() call unchanged.
 * `usePriceBook` bumps a version so screens showing prices re-render.
 */
const GROUPS: Record<string, { id: string; price: number }[]> = {
  beans: BEANS,
  sizes: SIZES,
  bases: BASES,
  serves: SERVES,
  milks: MILKS,
  foams: FOAMS,
  arts: ARTS,
  extras: EXTRAS,
  vessels: VESSELS,
};

export type PriceBookPayload = Partial<Record<string, { id: string; price: number }[]>>;

/** Writes the server's prices onto the option lists. True when anything changed. */
export function applyPriceBook(payload: PriceBookPayload): boolean {
  let changed = false;
  for (const [group, list] of Object.entries(GROUPS)) {
    for (const remote of payload[group] ?? []) {
      const local = list.find((o) => o.id === remote.id);
      if (local && typeof remote.price === 'number' && local.price !== remote.price) {
        local.price = remote.price;
        changed = true;
      }
    }
  }
  return changed;
}

/** Subscribe with `usePriceBook((s) => s.version)` to re-render when prices land. */
export const usePriceBook = create<{ version: number }>(() => ({ version: 0 }));

/**
 * What a recipe's fixed menu price adds to (or takes off) its formula.
 *
 * Zero for anything that is not a recipe, or a recipe priced by its
 * ingredients. The server charges formula plus this, so the bag does too.
 */
export function recipeAdjustment(product: {
  price: number | string;
  recipe?: { build: unknown } | null;
}): number {
  if (!product.recipe) return 0;
  return Number(product.price) - priceOf(product.recipe.build as Build);
}
