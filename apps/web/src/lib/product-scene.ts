import { DEFAULT_BUILD, type Build } from './builder';

/**
 * How any menu product is drawn in 3D.
 *
 * A drink is drawn from a formula, the same one the configurator produces and
 * the CRM recipe editor saves. A product that is not a recipe has no formula
 * stored, so one is read off its name: "Iced Latte" is a latte over ice, in
 * glass. Anything that is not a drink gets a food model chosen the same way,
 * by name first and by menu section after, so a pastry added from the CRM
 * tomorrow still looks like a pastry without anyone touching this file.
 */

type Named = { name: string; category?: { name: string } | null };

export type FoodKind =
  | 'croissant'
  | 'painAuChocolat'
  | 'cinnamonRoll'
  | 'scone'
  | 'cookie'
  | 'muffin'
  | 'loaf'
  | 'bagel'
  | 'toast'
  | 'sandwich'
  | 'wrap'
  | 'soup'
  | 'bowl'
  | 'beans'
  | 'bag';

const NOT_DRINK =
  /\bbeans?\b|grano|pastr|bakery|panader|food|kitchen|lunch|breakfast|snack|bagel|bread|croissant|cake|muffin|cookie|scone|\broll\b|sandwich|toast|salad|soup|wrap|bollo|comida|merch/i;
const DRINK =
  /coffee|caf[eé]|made to order|drink|bebida|\btea\b|latte|matcha|hojicha|chai|seasonal|brew|espresso|americano|cortado|cappuccino|macchiato|mocha|cocoa|frapp|smoothie|shake|juice|lemonade|tonic|soda|kombucha|iced|cold/i;

/** Whether a product is served in a cup. The menu section decides first. */
export function isDrink(p: Named, recipeNames: string[] = []): boolean {
  const section = p.category?.name ?? '';
  if (section) {
    if (NOT_DRINK.test(section)) return false;
    if (DRINK.test(section)) return true;
  }
  if (recipeNames.some((n) => n.toLowerCase() === p.name.toLowerCase())) return true;
  if (NOT_DRINK.test(p.name)) return false;
  return DRINK.test(p.name);
}

const FOOD_RULES: [RegExp, FoodKind][] = [
  [/pain au chocolat|chocolatine|chocolate croissant/i, 'painAuChocolat'],
  [/croissant/i, 'croissant'],
  [/cinnamon|\broll\b|\bbun\b|swirl|danish|concha/i, 'cinnamonRoll'],
  [/scone/i, 'scone'],
  [/cookie|biscuit|alfajor/i, 'cookie'],
  [/muffin|cupcake/i, 'muffin'],
  [/bread|loaf|cake|brownie|banana/i, 'loaf'],
  [/bagel/i, 'bagel'],
  [/toast/i, 'toast'],
  [/sandwich|panini|burger|croque|\bsub\b|torta/i, 'sandwich'],
  [/wrap|burrito|taco/i, 'wrap'],
  [/soup|chili|stew|broth|ramen|sopa/i, 'soup'],
  [/salad|bowl|quinoa|yogurt|granola|parfait|ensalada/i, 'bowl'],
  [/\bbeans?\b|grano|blend|single origin|roast|yirgacheffe|huila|guji|sumatra/i, 'beans'],
  // Section-level fallbacks, for a name that says nothing about its shape.
  [/pastr|bakery|panader|bollo/i, 'croissant'],
  [/food|kitchen|lunch|breakfast|comida/i, 'sandwich'],
];

/** Which model stands in for a product that is not a drink. */
export function foodKindFor(p: Named): FoodKind {
  for (const text of [p.name, p.category?.name ?? '']) {
    const hit = FOOD_RULES.find(([re]) => re.test(text));
    if (hit) return hit[1];
  }
  // Merch, a gift card, something nobody planned for: a kraft bag with its
  // name on the label is honest about not knowing what is inside.
  return 'bag';
}

/**
 * The formula for a menu drink.
 *
 * A CRM recipe with the same name wins, because that is what the owner said
 * the drink is. Otherwise the name is read the way a barista would read it.
 */
export function buildForProduct(p: Named, recipes: { name: string; build: Build }[] = []): Build {
  const name = p.name.toLowerCase();
  const exact = recipes.find((r) => r.name.toLowerCase() === name);
  if (exact) return exact.build;

  const text = `${p.name} ${p.category?.name ?? ''}`.toLowerCase();
  const blended = /frapp|smoothie|shake|blended/.test(text);
  const cold = blended || /iced|\bcold\b|lemonade|tonic|chilled|kombucha|soda/.test(text);

  const b: Build = { ...DEFAULT_BUILD, extras: [], milk: 'whole', art: 'heart' };
  b.serve = blended ? 'blended' : cold ? 'iced' : 'hot';

  if (/matcha/.test(name)) Object.assign(b, { base: 'matcha', milk: 'oat' });
  else if (/hojicha|chai|\btea\b/.test(name)) Object.assign(b, { base: 'hojicha', milk: 'oat' });
  else if (/yuzu/.test(name)) Object.assign(b, { base: 'yuzu', milk: 'none' });
  else if (/americano|long black/.test(name)) Object.assign(b, { base: 'espresso', milk: 'none' });
  else if (/pour over|filter|batch|aeropress|drip|brew|chemex|v60/.test(name))
    Object.assign(b, { base: 'filter', milk: 'none' });
  else if (/cortado|gibraltar/.test(name))
    Object.assign(b, { base: 'latte', size: 'small', foam: 'flat', art: 'heart' });
  else if (/flat white/.test(name))
    Object.assign(b, { base: 'latte', size: 'small', foam: 'flat', art: 'rosetta' });
  else if (/cappuccino/.test(name))
    Object.assign(b, { base: 'espresso', size: 'small', foam: 'cappuccino', art: 'none' });
  else if (/macchiato/.test(name))
    Object.assign(b, { base: 'espresso', size: 'small', foam: 'dollop', art: 'none' });
  else if (/espresso|ristretto|doppio/.test(name))
    Object.assign(b, { base: 'espresso', size: 'small', milk: 'none' });
  else if (/mocha|chocolate|cocoa/.test(name))
    Object.assign(b, { base: 'latte', beans: 'sumatra', foam: 'micro' });
  else Object.assign(b, { base: 'latte', foam: 'micro' });

  return withVessel(b, false);
}

/**
 * The cup for for-here or to-go.
 *
 * Hot for here is ceramic. Anything cold is clear, always: nobody orders an
 * iced drink to look at a mug. To go is the paper cup for hot, and the 3D
 * draws a clear plastic cup with a straw for cold.
 */
export function withVessel(build: Build, togo: boolean): Build {
  return {
    ...build,
    vessel: togo ? 'togo' : build.serve === 'hot' ? 'here' : 'glass',
  };
}
