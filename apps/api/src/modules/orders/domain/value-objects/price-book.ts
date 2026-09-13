import type { DrinkBuild } from './drink-build';
import { DRINK_CATALOGUE, type DrinkOption } from './drink-catalogue';
import { priceOfBuild } from './drink-price';

/** The component groups a price can be set for, in the order a drink is built. */
export type PriceGroup = keyof typeof DRINK_CATALOGUE;
export const PRICE_GROUPS = Object.keys(DRINK_CATALOGUE) as PriceGroup[];

const key = (group: string, id: string) => `${group}:${id}`;
const optionsOf = (group: PriceGroup) => DRINK_CATALOGUE[group] as readonly DrinkOption[];

/** Prices as written in drink-catalogue.ts, captured before anything overrides them. */
const DEFAULTS = new Map(
  PRICE_GROUPS.flatMap((group) =>
    optionsOf(group).map((o) => [key(group, o.id), o.price] as const),
  ),
);

/** The price an option has in code, or undefined when there is no such option. */
export function defaultPriceOf(group: string, id: string): number | undefined {
  return DEFAULTS.get(key(group, id));
}

/**
 * Puts the counter's prices onto the catalogue.
 *
 * Any option without a row goes back to its default, so deleting a row is how
 * a price is reset.
 *
 * ponytail: this mutates the shared catalogue in memory, so every existing
 * sum (orders, the builder's running total, recipes, favourites) picks the new
 * price up without threading a price table through all of them. It holds for
 * one API instance. With several, a change made on one reaches the others on
 * their next boot; the upgrade is reading the rows per request or broadcasting
 * the change.
 */
export function applyPrices(rows: { group: string; optionId: string; price: number }[]): void {
  const set = new Map(rows.map((r) => [key(r.group, r.optionId), r.price]));
  for (const group of PRICE_GROUPS) {
    for (const option of optionsOf(group) as DrinkOption[]) {
      option.price =
        set.get(key(group, option.id)) ?? DEFAULTS.get(key(group, option.id)) ?? option.price;
    }
  }
}

/**
 * What one recipe line costs.
 *
 * Without a fixed price it is the sum of its ingredients, like any build. With
 * one, it is that fixed price plus whatever the customer changed on the
 * recipe: an extra shot or a larger size adds its own price, choosing a cheaper
 * milk takes it off. Never below zero.
 */
export function priceOfRecipeLine(
  line: DrinkBuild,
  recipe: { build: DrinkBuild; priceOverride: number | null } | null,
): number {
  const formula = priceOfBuild(line);
  if (!recipe || recipe.priceOverride === null) return formula;
  const price = recipe.priceOverride + formula - priceOfBuild(recipe.build);
  return Math.max(0, Math.round(price * 100) / 100);
}
