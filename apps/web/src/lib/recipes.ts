import {
  DEFAULT_BUILD,
  describe,
  priceOf,
  sceneOf,
  type ArtId,
  type Build,
  type FoamId,
  type Serve,
  type SizeId,
  type Vessel,
} from './builder';

/**
 * The menu, expressed as formulas.
 *
 * A drink here is not a name and a price. It is a `Build`: the same object the
 * configurator produces and the same one the 3D preview renders. That means a
 * recipe can be poured on screen, priced, described for a ticket, and later
 * stored against an order, all from one definition.
 *
 * The point for the API: `Recipe.build` is the whole formula. A seasonal drink
 * is a row, a signature drink is a row, and a customer's own build is a row of
 * the same shape. Pricing is derived rather than typed in, so the menu and the
 * configurator can never disagree about what a latte costs.
 */

export type RecipeKind = 'signature' | 'seasonal';

export type Recipe = {
  id: string;
  name: string;
  /** Native-script name, where the drink has one. */
  accent?: string;
  kind: RecipeKind;
  /** Only for seasonal drinks. */
  season?: string;
  note: string;
  /** The formula. Everything else is derived from it. */
  build: Build;
};

/** Shorthand so each recipe reads as the handful of choices that define it. */
function recipe(
  id: string,
  name: string,
  kind: RecipeKind,
  note: string,
  build: Partial<Build>,
  extra: { accent?: string; season?: string } = {},
): Recipe {
  return { id, name, kind, note, build: { ...DEFAULT_BUILD, ...build }, ...extra };
}

/* ── What we pour every day ──────────────────────────────── */

export const SIGNATURES: Recipe[] = [
  recipe(
    'espresso',
    'Espresso',
    'signature',
    'Two shots, nothing else. The one to judge a roaster by.',
    { base: 'espresso', size: 'small', serve: 'hot', milk: 'none', vessel: 'here', extras: [] },
  ),

  recipe(
    'flat-white',
    'Flat White',
    'signature',
    'Double ristretto under the thinnest possible milk.',
    {
      base: 'latte',
      size: 'small',
      serve: 'hot',
      milk: 'whole',
      foam: 'flat',
      art: 'rosetta',
      vessel: 'here',
    },
  ),

  recipe(
    'cappuccino',
    'Cappuccino',
    'signature',
    'Dry foam standing proud of the rim, dusted with cinnamon.',
    {
      base: 'espresso',
      size: 'small',
      serve: 'hot',
      milk: 'whole',
      foam: 'cappuccino',
      art: 'none',
      vessel: 'here',
      extras: ['cinnamon'],
    },
  ),

  recipe(
    'latte',
    'Oat Latte',
    'signature',
    'Our most ordered drink, and the one we pour art into.',
    {
      base: 'latte',
      size: 'medium',
      serve: 'hot',
      milk: 'oat',
      foam: 'micro',
      art: 'heart',
      vessel: 'here',
    },
  ),

  recipe(
    'cold-brew',
    'Cold Brew',
    'signature',
    'Twenty hours steeped, served over ice. Smooth, never bitter.',
    { base: 'filter', size: 'large', serve: 'iced', milk: 'none', vessel: 'glass', extras: [] },
  ),

  recipe('matcha', 'Matcha Latte', 'signature', 'Ceremonial grade, whisked, over cold oat milk.', {
    base: 'matcha',
    size: 'medium',
    serve: 'iced',
    milk: 'oat',
    vessel: 'glass',
  }),
];

/* ── What we pour for a few weeks only ───────────────────── */

export const SEASONALS: Recipe[] = [
  recipe(
    'yuzu-americano',
    'Yuzu Americano',
    'seasonal',
    'Korean citrus over a long black. Bright, bitter, a little sour.',
    { base: 'yuzu', size: 'medium', serve: 'iced', milk: 'none', vessel: 'glass', extras: [] },
    { accent: '유자', season: 'Autumn' },
  ),

  recipe(
    'hojicha-latte',
    'Hojicha Latte',
    'seasonal',
    'Roasted green tea and steamed oat milk. Toasty, low caffeine.',
    {
      base: 'hojicha',
      size: 'medium',
      serve: 'hot',
      milk: 'oat',
      foam: 'micro',
      art: 'tulip',
      vessel: 'here',
    },
    { accent: 'ほうじ茶', season: 'Autumn' },
  ),

  recipe(
    'black-sesame',
    'Black Sesame Latte',
    'seasonal',
    'Stone-ground sesame, oat milk, a pinch of sea salt.',
    {
      base: 'latte',
      beans: 'sumatra',
      size: 'medium',
      serve: 'hot',
      milk: 'oat',
      foam: 'micro',
      art: 'rosetta',
      vessel: 'here',
      extras: ['sugar'],
    },
    { accent: '흑임자', season: 'Winter' },
  ),

  recipe(
    'fir-cold-brew',
    'Douglas Fir Cold Brew',
    'seasonal',
    'Cold brew infused with fir tips foraged up the Sea-to-Sky.',
    {
      base: 'filter',
      beans: 'ethiopia',
      size: 'large',
      serve: 'iced',
      milk: 'none',
      vessel: 'glass',
      extras: [],
    },
    { season: 'Spring' },
  ),

  recipe(
    'sesame-frappe',
    'Sesame Frappé',
    'seasonal',
    'The winter latte, blended, with cream and cinnamon on top.',
    {
      base: 'latte',
      beans: 'sumatra',
      size: 'large',
      serve: 'blended',
      milk: 'oat',
      vessel: 'glass',
      extras: ['cream', 'cinnamon'],
    },
    { season: 'Summer' },
  ),
];

export const RECIPES: Recipe[] = [...SIGNATURES, ...SEASONALS];

export const recipeById = (id: string) => RECIPES.find((r) => r.id === id);

/** Price, derived from the formula rather than typed in beside it. */
export const recipePrice = (r: Recipe) => priceOf(r.build);

/** The ticket line, in the same words the configurator would use. */
export const recipeTicket = (r: Recipe) => describe(r.build);

/** What the 3D preview needs, straight from the formula. */
export const recipeScene = (r: Recipe) => sceneOf(r.build);

/**
 * The shape an order line would store. Kept here so the API and the client
 * agree on one payload: the recipe it came from, plus the exact build, so a
 * customised drink and a menu drink are the same record.
 */
export type OrderLine = {
  recipeId: string | null;
  build: Build;
  /** Snapshot: what the customer was shown when they ordered. */
  name: string;
  ticket: string;
  price: number;
};

export function toOrderLine(build: Build, recipeId: string | null = null): OrderLine {
  const from = recipeId ? recipeById(recipeId) : undefined;
  return {
    recipeId,
    build,
    name: from?.name ?? 'Custom drink',
    ticket: describe(build),
    price: priceOf(build),
  };
}

export type { Build, Serve, Vessel, SizeId, FoamId, ArtId };
