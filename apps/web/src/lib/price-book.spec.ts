import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_BUILD, MILKS, priceOf } from './builder';
import { applyPriceBook, recipeAdjustment } from './price-book';

const oat = MILKS.find((m) => m.id === 'oat')!;
const defaultOat = oat.price;

describe('applyPriceBook', () => {
  afterEach(() => {
    oat.price = defaultOat;
  });

  it('writes the server price onto the builder options', () => {
    const build = { ...DEFAULT_BUILD, milk: 'oat' };
    const before = priceOf(build);
    expect(applyPriceBook({ milks: [{ id: 'oat', price: defaultOat + 0.5 }] })).toBe(true);
    expect(priceOf(build)).toBeCloseTo(before + 0.5, 2);
  });

  it('reports nothing changed when prices already match, and ignores unknown ids', () => {
    expect(
      applyPriceBook({
        milks: [
          { id: 'oat', price: defaultOat },
          { id: 'almond', price: 9 },
        ],
      }),
    ).toBe(false);
  });
});

describe('recipeAdjustment', () => {
  it('is zero for a product that is not a recipe', () => {
    expect(recipeAdjustment({ price: 4.5 })).toBe(0);
  });

  it('is the gap between the fixed menu price and the formula', () => {
    const formula = priceOf(DEFAULT_BUILD);
    expect(
      recipeAdjustment({ price: formula + 0.4, recipe: { build: DEFAULT_BUILD } }),
    ).toBeCloseTo(0.4, 2);
    expect(
      recipeAdjustment({ price: String(formula), recipe: { build: DEFAULT_BUILD } }),
    ).toBeCloseTo(0, 2);
  });
});
