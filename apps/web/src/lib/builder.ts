/**
 * The coffee builder.
 *
 * This shape is the contract between the 3D preview, the configurator UI and
 * the order that eventually reaches the API. Keep it serialisable and keep the
 * ids stable: they are what a future `OrderItem.options` will store.
 */

export type Serve = 'hot' | 'iced' | 'blended';
export type Vessel = 'togo' | 'here' | 'glass';

export type Option = {
  id: string;
  name: string;
  /** Shown under the name in the picker. */
  note: string;
  /** Added to the base price, in dollars. */
  price: number;
};

export type BaseOption = Option & {
  /** Colour of the brew surface. */
  liquid: string;
  /** Surface roughness: milk drinks are matte, black coffee is glossy. */
  gloss: number;
  /** How much of the surface a crema covers before extras are added, 0 to 1. */
  foam: number;
};

/* ── Step 1 · the beans ──────────────────────────────────── */
export type BeanOption = Option & {
  /** Colour of the roasted bean itself. */
  bean: string;
  /** 0 light, 1 dark. Shifts how dark the brew pulls. */
  roast: number;
};

export const BEANS: BeanOption[] = [
  {
    id: 'ethiopia',
    name: 'Ethiopia Guji',
    note: 'Light roast · jasmine, peach',
    price: 0,
    bean: '#8A5A33',
    roast: 0.15,
  },
  {
    id: 'colombia',
    name: 'Colombia Huila',
    note: 'Medium roast · cocoa, orange',
    price: 0,
    bean: '#6B3E22',
    roast: 0.5,
  },
  {
    id: 'sumatra',
    name: 'Sumatra Gayo',
    note: 'Dark roast · cedar, molasses',
    price: 0.5,
    bean: '#3A2116',
    roast: 0.9,
  },
  {
    id: 'house',
    name: 'House blend',
    note: 'What the regulars drink',
    price: 0,
    bean: '#5A3420',
    roast: 0.55,
  },
];

/* ── Step 2 · the size ───────────────────────────────────── */

export type SizeId = 'small' | 'medium' | 'large';

export const SIZES: (Option & { id: SizeId; scale: number; volume: string })[] = [
  { id: 'small', name: 'Small', note: '8 oz · one shot', price: 0, scale: 0.86, volume: '8 oz' },
  {
    id: 'medium',
    name: 'Medium',
    note: '12 oz · two shots',
    price: 0.75,
    scale: 1.0,
    volume: '12 oz',
  },
  {
    id: 'large',
    name: 'Large',
    note: '16 oz · two shots',
    price: 1.4,
    scale: 1.16,
    volume: '16 oz',
  },
];

/* ── Step 3 · the drink ──────────────────────────────────── */
export const BASES: BaseOption[] = [
  {
    id: 'espresso',
    name: 'Espresso',
    note: 'Two shots, nothing else',
    price: 4.0,
    liquid: '#3A2116',
    gloss: 0.1,
    foam: 0.35,
  },
  {
    id: 'filter',
    name: 'Filter',
    note: 'Single origin, brewed to order',
    price: 4.5,
    liquid: '#6B3E22',
    gloss: 0.08,
    foam: 0.0,
  },
  {
    id: 'latte',
    name: 'Latte',
    note: 'Espresso and steamed milk',
    price: 5.0,
    liquid: '#C09A6B',
    gloss: 0.55,
    foam: 0.92,
  },
  {
    id: 'matcha',
    name: 'Matcha',
    note: 'Ceremonial grade, whisked',
    price: 5.75,
    liquid: '#7A9A43',
    gloss: 0.5,
    foam: 0.8,
  },
  {
    id: 'hojicha',
    name: 'Hojicha',
    note: 'Roasted green tea',
    price: 5.5,
    liquid: '#A87246',
    gloss: 0.5,
    foam: 0.85,
  },
  {
    id: 'yuzu',
    name: 'Yuzu Americano',
    note: 'Korean citrus over a long black',
    price: 5.5,
    liquid: '#C8721F',
    gloss: 0.12,
    foam: 0.25,
  },
];

/* ── Step 2 · how it is served ───────────────────────────── */
export const SERVES: (Option & { id: Serve })[] = [
  { id: 'hot', name: 'Hot', note: 'Served at 65°C', price: 0 },
  { id: 'iced', name: 'Iced', note: 'Over ice, same strength', price: 0.5 },
  { id: 'blended', name: 'Blended', note: 'Smoothie texture, no ice cubes', price: 1.25 },
];

/* ── Step 3 · the milk ───────────────────────────────────── */
export const MILKS: (Option & { tint: string })[] = [
  { id: 'none', name: 'No milk', note: 'Black', price: 0, tint: '#00000000' },
  { id: 'whole', name: 'Whole', note: 'House standard', price: 0, tint: '#F3E7D2' },
  { id: 'oat', name: 'Oat', note: 'Our most ordered', price: 0.75, tint: '#EADFC7' },
  { id: 'soy', name: 'Soy', note: 'Lightly sweetened', price: 0.75, tint: '#F1E6CE' },
];

/* ── Step 3a · the foam ──────────────────────────────────── */

export type FoamId = 'micro' | 'cappuccino' | 'flat' | 'dollop';

/**
 * How the milk is textured, which is the actual difference between the drinks
 * a café sells. A latte and a cappuccino are the same two ingredients; what
 * separates them is how much air went into the milk and how it sits.
 */
export const FOAMS: (Option & {
  id: FoamId;
  /** How far the foam stands above the brew, in scene units. */
  height: number;
  /** Share of the surface it covers, 0 to 1. */
  coverage: number;
  /** Dry foam scatters, wet microfoam reflects. */
  roughness: number;
  /** Whether a pattern can be poured into it. */
  pourable: boolean;
})[] = [
  {
    id: 'micro',
    name: 'Microfoam',
    note: 'Latte. Thin, wet, glossy',
    price: 0,
    height: 0.055,
    coverage: 0.94,
    roughness: 0.62,
    pourable: true,
  },
  {
    id: 'flat',
    name: 'Flat white',
    note: 'Thinnest pour, highest shine',
    price: 0,
    height: 0.03,
    coverage: 0.97,
    roughness: 0.5,
    pourable: true,
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    note: 'Thick, dry, stands proud of the rim',
    price: 0.3,
    height: 0.2,
    coverage: 0.99,
    roughness: 0.99,
    pourable: false,
  },
  {
    id: 'dollop',
    name: 'Macchiato',
    note: 'One spoon of foam in the middle',
    price: 0,
    height: 0.1,
    coverage: 0.42,
    roughness: 0.95,
    pourable: false,
  },
];

/* ── Step 3b · latte art ─────────────────────────────────── */

export type ArtId = 'none' | 'heart' | 'rosetta' | 'tulip' | 'swan';

/**
 * Only pourable on a hot milk drink. Iced coffee has no crema to pour onto
 * and a blended drink has no surface at all, so the picker hides itself.
 */
export const ARTS: (Option & { id: ArtId })[] = [
  { id: 'none', name: 'Plain', note: 'No pattern', price: 0 },
  { id: 'heart', name: 'Heart', note: 'The one every barista learns', price: 0 },
  { id: 'rosetta', name: 'Rosetta', note: 'The leaf, poured in a wiggle', price: 0.4 },
  { id: 'tulip', name: 'Tulip', note: 'Stacked hearts', price: 0.4 },
  { id: 'swan', name: 'Swan', note: 'Ask for our head barista', price: 0.9 },
];

/* ── Step 4 · extras ─────────────────────────────────────── */
export const EXTRAS: (Option & { kind: 'sweet' | 'top' | 'shot' })[] = [
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

/* ── Step 5 · the cup ────────────────────────────────────── */
export const VESSELS: (Option & { id: Vessel })[] = [
  { id: 'togo', name: 'To go', note: 'Paper cup, sleeve and lid', price: 0 },
  { id: 'here', name: 'For here', note: 'Ceramic. Nothing to throw away', price: -0.3 },
  { id: 'glass', name: 'Glass', note: 'Clear tumbler. You see the layers', price: 0.4 },
];

/** Sleeve colours for the to-go cup. */
export const SLEEVES: { id: string; name: string; hex: string }[] = [
  { id: 'kraft', name: 'Kraft', hex: '#C39A5C' },
  { id: 'forest', name: 'Forest', hex: '#3C6B4A' },
  { id: 'acid', name: 'Oliva', hex: '#A9C23F' },
  { id: 'ink', name: 'Ink', hex: '#1A1A1A' },
  { id: 'clay', name: 'Clay', hex: '#B5654A' },
];

/* ── The build ───────────────────────────────────────────── */

export type Build = {
  beans: string;
  size: SizeId;
  base: string;
  serve: Serve;
  milk: string;
  foam: FoamId;
  art: ArtId;
  extras: string[];
  vessel: Vessel;
  sleeve: string;
};

export const DEFAULT_BUILD: Build = {
  beans: 'colombia',
  size: 'medium',
  base: 'latte',
  serve: 'hot',
  milk: 'oat',
  foam: 'micro',
  art: 'rosetta',
  extras: [],
  vessel: 'togo',
  sleeve: 'kraft',
};

/** Steamed milk only happens on a hot drink that takes milk at all. */
export function hasFoam(build: Build): boolean {
  return build.serve === 'hot' && build.milk !== 'none' && baseOf(build).foam > 0.3;
}

/** Art needs foam you can actually pour through. Dry cappuccino foam is too
 *  stiff to take a pattern, which is true in the café as well as here. */
export function canPourArt(build: Build): boolean {
  return hasFoam(build) && foamOf(build).pourable;
}

const byId = <T extends { id: string }>(list: T[], id: string) =>
  list.find((o) => o.id === id) ?? list[0];

export const beansOf = (b: Build) => byId(BEANS, b.beans);
export const sizeOf = (b: Build) => byId(SIZES, b.size);
export const baseOf = (b: Build) => byId(BASES, b.base);
export const serveOf = (b: Build) => byId(SERVES, b.serve);
export const milkOf = (b: Build) => byId(MILKS, b.milk);
export const foamOf = (b: Build) => byId(FOAMS, b.foam);
export const artOf = (b: Build) => byId(ARTS, b.art);
export const vesselOf = (b: Build) => byId(VESSELS, b.vessel);
export const sleeveOf = (b: Build) => byId(SLEEVES, b.sleeve);

/** Total in dollars. The same sum the API will have to agree with. */
export function priceOf(build: Build): number {
  const extras = EXTRAS.filter((e) => build.extras.includes(e.id));
  return (
    beansOf(build).price +
    sizeOf(build).price +
    baseOf(build).price +
    serveOf(build).price +
    milkOf(build).price +
    (hasFoam(build) ? foamOf(build).price : 0) +
    (canPourArt(build) ? artOf(build).price : 0) +
    vesselOf(build).price +
    extras.reduce((sum, e) => sum + e.price, 0)
  );
}

/** One-line description, the way it would read on a ticket. */
export function describe(build: Build): string {
  const parts = [
    sizeOf(build).volume,
    serveOf(build).name,
    baseOf(build).name,
    beansOf(build).name,
  ];
  if (build.milk !== 'none') parts.push(`${milkOf(build).name.toLowerCase()} milk`);
  if (hasFoam(build)) parts.push(foamOf(build).name.toLowerCase());
  const extras = EXTRAS.filter((e) => build.extras.includes(e.id)).map((e) => e.name.toLowerCase());
  if (canPourArt(build) && build.art !== 'none') {
    parts.push(`${artOf(build).name.toLowerCase()} art`);
  }
  if (extras.length) parts.push(extras.join(', '));
  parts.push(vesselOf(build).name.toLowerCase());
  return parts.join(' · ');
}

/**
 * What the 3D scene needs. Derived rather than stored, so the preview can
 * never drift out of sync with the build.
 */
export function sceneOf(build: Build) {
  const base = baseOf(build);
  const beans = beansOf(build);
  const milk = milkOf(build);
  const hasCream = build.extras.includes('cream');
  const blended = build.serve === 'blended';

  // A darker roast pulls a darker shot.
  const brewed = mix(base.liquid, '#160B05', (beans.roast - 0.5) * 0.36 + 0.18);

  // Milk lightens the brew. Blending lightens it further and kills the gloss.
  let liquid = brewed;
  if (build.milk !== 'none' && base.foam > 0) liquid = mix(brewed, milk.tint, 0.32);
  if (blended) liquid = mix(liquid, '#FFFFFF', 0.22);
  // Vanilla syrup is amber and sweet: it warms the cup and adds shine.
  if (build.extras.includes('syrup')) liquid = mix(liquid, '#C98A3C', 0.16);

  return {
    /** Before milk. The pour animates from this to `liquid`. */
    brewed,
    liquid,
    bean: beans.bean,
    milkTint: milk.tint === '#00000000' ? '#F3E7D2' : milk.tint,
    hasMilk: build.milk !== 'none' && base.foam > 0,
    gloss: blended ? 0.85 : build.extras.includes('syrup') ? base.gloss * 0.55 : base.gloss,
    foam: hasCream ? 1 : blended ? 0.95 : hasFoam(build) ? foamOf(build).coverage : base.foam,
    /** Dome height and finish of the milk cap. */
    foamHeight: hasFoam(build) ? foamOf(build).height : 0.05,
    foamRoughness: hasFoam(build) ? foamOf(build).roughness : 0.98,
    /** A blended drink is a slush: no separate surface, a soft mound instead. */
    blended,
    cream: hasCream,
    ice: build.serve === 'iced',
    cinnamon: build.extras.includes('cinnamon'),
    /** Which pattern to pour, or none. Cream on top would bury it. */
    art: canPourArt(build) && !hasCream ? build.art : ('none' as ArtId),
    sugar: build.extras.includes('sugar'),
    /** Syrup darkens the brew slightly and leaves it glossier. */
    syrup: build.extras.includes('syrup'),
    // Cold is always clear: an iced drink ordered for here comes in glass,
    // never in a ceramic mug.
    vessel: build.serve !== 'hot' && build.vessel === 'here' ? ('glass' as Vessel) : build.vessel,
    sleeve: sleeveOf(build).hex,
    /** Iced and blended drinks are filled higher and colder. */
    fill: build.serve === 'hot' ? 1 : 1.04,
    /** Overall size of the vessel. */
    scale: sizeOf(build).scale,
    /** Steam rises off a hot drink and nothing else. */
    hot: build.serve === 'hot',
  };
}

/** Blend two hex colours. Small enough not to warrant a colour library. */
function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1, 7), 16);
  const pb = parseInt(b.slice(1, 7), 16);
  const ch = (shift: number) => {
    const va = (pa >> shift) & 255;
    const vb = (pb >> shift) & 255;
    return Math.round(va + (vb - va) * t);
  };
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}
