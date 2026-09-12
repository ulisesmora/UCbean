/**
 * The formula for a drink, as the shop makes it.
 *
 * A menu drink and a customer's own drink are the same record: both are a set
 * of choices. That is what lets one order line describe either, and what lets
 * the kitchen rebuild a recipe months later from the row alone.
 *
 * These ids are written into `OrderItem.options` as JSON, so renaming one
 * rewrites history. Add, don't rename.
 */

export type Serve = 'hot' | 'iced' | 'blended';
export type Vessel = 'togo' | 'here' | 'glass';
export type DrinkSize = 'small' | 'medium' | 'large';
export type Foam = 'micro' | 'cappuccino' | 'flat' | 'dollop';
export type LatteArt = 'none' | 'heart' | 'rosetta' | 'tulip' | 'swan';

export interface DrinkBuild {
  /** Origin and roast. */
  beans: string;
  size: DrinkSize;
  /** Espresso, filter, latte, matcha and so on. */
  base: string;
  serve: Serve;
  /** `none` for a black coffee. */
  milk: string;
  foam: Foam;
  art: LatteArt;
  /** Sugar, syrup, cream, cinnamon, extra shot. */
  extras: string[];
  vessel: Vessel;
  sleeve: string;
}
