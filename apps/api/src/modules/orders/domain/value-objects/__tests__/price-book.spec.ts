import type { DrinkBuild } from '../drink-build';
import { MILKS, EXTRAS } from '../drink-catalogue';
import { priceOfBuild } from '../drink-price';
import { applyPrices, defaultPriceOf, priceOfRecipeLine } from '../price-book';

const latte: DrinkBuild = {
  beans: 'colombia',
  size: 'medium',
  base: 'latte',
  serve: 'hot',
  milk: 'oat',
  foam: 'micro',
  art: 'heart',
  extras: [],
  vessel: 'togo',
  sleeve: 'kraft',
};

describe('price book', () => {
  afterEach(() => applyPrices([]));

  it('changes what a component costs and what a drink sums to', () => {
    const before = priceOfBuild(latte);
    applyPrices([{ group: 'milks', optionId: 'oat', price: 1.25 }]);
    expect(MILKS.find((m) => m.id === 'oat')?.price).toBe(1.25);
    expect(priceOfBuild(latte)).toBeCloseTo(before - 0.75 + 1.25, 2);
  });

  it('resets a component to its default when its row is gone', () => {
    applyPrices([{ group: 'extras', optionId: 'cream', price: 2 }]);
    applyPrices([]);
    expect(EXTRAS.find((e) => e.id === 'cream')?.price).toBe(defaultPriceOf('extras', 'cream'));
  });

  it('knows the defaults written in code and nothing else', () => {
    expect(defaultPriceOf('milks', 'oat')).toBe(0.75);
    expect(defaultPriceOf('milks', 'almond')).toBeUndefined();
  });
});

describe('priceOfRecipeLine', () => {
  it('charges the sum of ingredients when the recipe has no fixed price', () => {
    expect(priceOfRecipeLine(latte, { build: latte, priceOverride: null })).toBe(
      priceOfBuild(latte),
    );
    expect(priceOfRecipeLine(latte, null)).toBe(priceOfBuild(latte));
  });

  it('charges the fixed price for the recipe as it is', () => {
    expect(priceOfRecipeLine(latte, { build: latte, priceOverride: 6 })).toBe(6);
  });

  it('adds what the customer changed on top of the fixed price', () => {
    const withShot = { ...latte, extras: ['extrashot'] };
    expect(priceOfRecipeLine(withShot, { build: latte, priceOverride: 6 })).toBe(7);
  });

  it('never goes below zero', () => {
    const cheap = { ...latte, base: 'espresso', milk: 'none' };
    expect(priceOfRecipeLine(cheap, { build: latte, priceOverride: 0.5 })).toBeGreaterThanOrEqual(
      0,
    );
  });
});
