/**
 * Everything that can go into a drink, and what each choice costs.
 *
 * This is the coffee creator's parts list. The configurator draws its steps
 * from it, the price of a build is summed from it, and a recipe is nothing but
 * a set of ids pointing into it. One table, so the menu, the price and the
 * ticket can never disagree.
 *
 * Ids are permanent. They are stored inside `OrderItem.options`, so renaming
 * one rewrites what past orders say they were. Add a new id instead.
 */

export interface DrinkOption {
  id: string;
  name: string;
  /** The line under the name in the picker. */
  note: string;
  /** Added to the drink's total, in dollars. Can be negative. */
  price: number;
}

/** A brewed base also says how much foam it can carry, which gates latte art. */
export interface BaseOption extends DrinkOption {
  /** 0 to 1. Above 0.3 the drink can take steamed milk. */
  foam: number;
}

/** Foam says whether a pattern can be poured into it. */
export interface FoamOption extends DrinkOption {
  pourable: boolean;
}

/** Extras are grouped so the picker can lay them out. */
export interface ExtraOption extends DrinkOption {
  kind: 'sweet' | 'top' | 'shot';
}

export const BEANS: DrinkOption[] = [
  { id: 'ethiopia', name: 'Ethiopia Guji', note: 'Light roast · jasmine, peach', price: 0 },
  { id: 'colombia', name: 'Colombia Huila', note: 'Medium roast · cocoa, orange', price: 0 },
  { id: 'sumatra', name: 'Sumatra Gayo', note: 'Dark roast · cedar, molasses', price: 0.5 },
  { id: 'house', name: 'House blend', note: 'What the regulars drink', price: 0 },
];

export const SIZES: (DrinkOption & { volume: string })[] = [
  { id: 'small', name: 'Small', note: '8 oz · one shot', price: 0, volume: '8 oz' },
  { id: 'medium', name: 'Medium', note: '12 oz · two shots', price: 0.75, volume: '12 oz' },
  { id: 'large', name: 'Large', note: '16 oz · two shots', price: 1.4, volume: '16 oz' },
];

export const BASES: BaseOption[] = [
  { id: 'espresso', name: 'Espresso', note: 'Two shots, nothing else', price: 4.0, foam: 0.35 },
  { id: 'filter', name: 'Filter', note: 'Single origin, brewed to order', price: 4.5, foam: 0.0 },
  { id: 'latte', name: 'Latte', note: 'Espresso and steamed milk', price: 5.0, foam: 0.92 },
  { id: 'matcha', name: 'Matcha', note: 'Ceremonial grade, whisked', price: 5.75, foam: 0.8 },
  { id: 'hojicha', name: 'Hojicha', note: 'Roasted green tea', price: 5.5, foam: 0.85 },
  {
    id: 'yuzu',
    name: 'Yuzu Americano',
    note: 'Korean citrus over a long black',
    price: 5.5,
    foam: 0.25,
  },
];

export const SERVES: DrinkOption[] = [
  { id: 'hot', name: 'Hot', note: 'Served at 65°C', price: 0 },
  { id: 'iced', name: 'Iced', note: 'Over ice, same strength', price: 0.5 },
  { id: 'blended', name: 'Blended', note: 'Smoothie texture, no ice cubes', price: 1.25 },
];

export const MILKS: DrinkOption[] = [
  { id: 'none', name: 'No milk', note: 'Black', price: 0 },
  { id: 'whole', name: 'Whole', note: 'House standard', price: 0 },
  { id: 'oat', name: 'Oat', note: 'Our most ordered', price: 0.75 },
  { id: 'soy', name: 'Soy', note: 'Lightly sweetened', price: 0.75 },
];

export const FOAMS: FoamOption[] = [
  { id: 'micro', name: 'Microfoam', note: 'Latte. Thin, wet, glossy', price: 0, pourable: true },
  {
    id: 'flat',
    name: 'Flat white',
    note: 'Thinnest pour, highest shine',
    price: 0,
    pourable: true,
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    note: 'Thick, dry, stands proud of the rim',
    price: 0.3,
    pourable: false,
  },
  {
    id: 'dollop',
    name: 'Macchiato',
    note: 'One spoon of foam in the middle',
    price: 0,
    pourable: false,
  },
];

export const ARTS: DrinkOption[] = [
  { id: 'none', name: 'Plain', note: 'No pattern', price: 0 },
  { id: 'heart', name: 'Heart', note: 'The one every barista learns', price: 0 },
  { id: 'rosetta', name: 'Rosetta', note: 'The leaf, poured in a wiggle', price: 0.4 },
  { id: 'tulip', name: 'Tulip', note: 'Stacked hearts', price: 0.4 },
  { id: 'swan', name: 'Swan', note: 'Ask for our head barista', price: 0.9 },
];

export const EXTRAS: ExtraOption[] = [
  { id: 'sugar', name: 'Sugar', note: 'One spoon', price: 0, kind: 'sweet' },
  { id: 'syrup', name: 'Vanilla syrup', note: 'House made', price: 0.6, kind: 'sweet' },
  { id: 'cream', name: 'Whipped cream', note: 'Piled on top', price: 0.9, kind: 'top' },
  { id: 'cinnamon', name: 'Cinnamon', note: 'Dusted over the foam', price: 0, kind: 'top' },
  {
    id: 'extrashot',
    name: 'Extra shot',
    note: 'Adds about 70mg caffeine',
    price: 1.0,
    kind: 'shot',
  },
];

export const VESSELS: DrinkOption[] = [
  { id: 'togo', name: 'To go', note: 'Paper cup, sleeve and lid', price: 0 },
  { id: 'here', name: 'For here', note: 'Ceramic. Nothing to throw away', price: -0.3 },
  { id: 'glass', name: 'Glass', note: 'Clear tumbler. You see the layers', price: 0.4 },
];

export const SLEEVES: (DrinkOption & { hex: string })[] = [
  { id: 'kraft', name: 'Kraft', note: 'Unbleached card', price: 0, hex: '#C39A5C' },
  { id: 'forest', name: 'Forest', note: 'Deep green', price: 0, hex: '#3C6B4A' },
  { id: 'acid', name: 'Olive', note: 'The house colour', price: 0, hex: '#A9C23F' },
  { id: 'ink', name: 'Ink', note: 'Flat black', price: 0, hex: '#1A1A1A' },
  { id: 'clay', name: 'Clay', note: 'Terracotta', price: 0, hex: '#B5654A' },
];

/** The whole parts list, in the order the customer is asked. */
export const DRINK_CATALOGUE = {
  beans: BEANS,
  sizes: SIZES,
  bases: BASES,
  serves: SERVES,
  milks: MILKS,
  foams: FOAMS,
  arts: ARTS,
  extras: EXTRAS,
  vessels: VESSELS,
  sleeves: SLEEVES,
} as const;

/** Looks an option up by id, or undefined when the menu has moved on. */
export function optionById<T extends DrinkOption>(list: T[], id: string): T | undefined {
  return list.find((o) => o.id === id);
}
