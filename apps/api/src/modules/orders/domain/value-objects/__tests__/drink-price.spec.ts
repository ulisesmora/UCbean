import { priceOfBuild } from '../drink-price';
import type { DrinkBuild } from '../drink-build';

/**
 * These totals are the contract with the configurator.
 *
 * `apps/web/src/lib/builder.ts` computes the same sums to show the customer a
 * price before they order. If a price moves in one table and not the other,
 * the customer is quoted one figure and billed another, and this is what says
 * so.
 */
const build = (over: Partial<DrinkBuild> = {}): DrinkBuild => ({
  beans: 'ethiopia',
  size: 'small',
  base: 'espresso',
  serve: 'hot',
  milk: 'none',
  foam: 'micro',
  art: 'none',
  extras: [],
  vessel: 'togo',
  sleeve: 'kraft',
  ...over,
});

describe('priceOfBuild', () => {
  it('prices a plain small espresso to go at the base price', () => {
    expect(priceOfBuild(build())).toBe(4.0);
  });

  it('adds size, milk and base, and takes the discount for a ceramic cup', () => {
    // 0 beans + 0.75 medium + 5.00 latte + 0 hot + 0.75 oat + 0 microfoam
    // + 0 heart + (-0.30) for here + 0 cinnamon
    const latte = build({
      size: 'medium',
      base: 'latte',
      milk: 'oat',
      art: 'heart',
      vessel: 'here',
      extras: ['cinnamon'],
    });
    expect(priceOfBuild(latte)).toBe(6.2);
  });

  it('charges for latte art only where it can actually be poured', () => {
    const pourable = build({ base: 'latte', milk: 'whole', foam: 'micro', art: 'swan' });
    const iced = build({ base: 'latte', milk: 'whole', foam: 'micro', art: 'swan', serve: 'iced' });

    // Compared as a difference of two rounded prices, so within a cent.
    expect(
      priceOfBuild(pourable) - priceOfBuild(build({ base: 'latte', milk: 'whole' })),
    ).toBeCloseTo(0.9, 2);
    // Iced coffee has no foam to pour into, so the swan is not billed.
    expect(priceOfBuild(iced)).toBe(
      priceOfBuild(build({ base: 'latte', milk: 'whole', serve: 'iced' })),
    );
  });

  it('lands on whole cents', () => {
    const fiddly = build({
      size: 'medium',
      base: 'latte',
      milk: 'oat',
      foam: 'cappuccino',
      extras: ['syrup', 'cream', 'extrashot'],
    });
    expect(priceOfBuild(fiddly)).toBe(Math.round(priceOfBuild(fiddly) * 100) / 100);
    // 0.75 + 5.00 + 0.75 + 0.30 + 0.60 + 0.90 + 1.00
    expect(priceOfBuild(fiddly)).toBe(9.3);
  });

  it('charges nothing for an id it does not recognise, rather than throwing', () => {
    expect(priceOfBuild(build({ beans: 'unknown-origin' }))).toBe(4.0);
  });
});
