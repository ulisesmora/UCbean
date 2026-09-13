import { describe, expect, it } from 'vitest';
import { DEFAULT_BUILD } from './builder';
import { buildForProduct, foodKindFor, isDrink, withVessel } from './product-scene';

const p = (name: string, category?: string) => ({
  name,
  category: category ? { name: category } : null,
});

describe('isDrink', () => {
  it('trusts the menu section first', () => {
    expect(isDrink(p('Cortado', 'Hot Coffee'))).toBe(true);
    expect(isDrink(p('Build your own', 'Made to order'))).toBe(true);
    expect(isDrink(p('House Blend', 'Whole Beans'))).toBe(false);
    expect(isDrink(p('Cinnamon roll', 'Pastries'))).toBe(false);
  });

  it('reads the name when the section says nothing', () => {
    expect(isDrink(p('Peach Iced Tea', 'Specials'))).toBe(true);
    expect(isDrink(p('Blueberry scone', 'Specials'))).toBe(false);
    expect(isDrink(p('Lavender Special', 'Specials'), ['Lavender Special'])).toBe(true);
  });
});

describe('foodKindFor', () => {
  it('maps every item on the current menu', () => {
    const kinds = {
      'Butter croissant': 'croissant',
      'Pain au chocolat': 'painAuChocolat',
      'Cinnamon roll': 'cinnamonRoll',
      'Blueberry scone': 'scone',
      'Banana bread': 'loaf',
      'Chocolate chip cookie': 'cookie',
      'Egg sandwich': 'sandwich',
      'Avocado toast': 'toast',
      'Salmon bagel': 'bagel',
      'Quinoa salad': 'bowl',
      'Soup of the day': 'soup',
      'Chicken wrap': 'wrap',
      'Ethiopia Yirgacheffe': 'beans',
      'House Blend': 'beans',
    } as const;
    for (const [name, kind] of Object.entries(kinds)) {
      expect(foodKindFor(p(name, 'Pastries'))).toBe(kind);
    }
  });

  it('falls back to the section, then to a labelled bag', () => {
    expect(foodKindFor(p('Grandma special', 'Pastries'))).toBe('croissant');
    expect(foodKindFor(p('Tote', 'Merch'))).toBe('bag');
  });
});

describe('buildForProduct', () => {
  it('uses a CRM recipe with the same name', () => {
    const build = { ...DEFAULT_BUILD, base: 'hojicha' };
    expect(buildForProduct(p('Hojicha Latte'), [{ name: 'hojicha latte', build }])).toBe(build);
  });

  it('puts cold drinks in glass and hot ones in ceramic', () => {
    const iced = buildForProduct(p('Iced Latte', 'Iced Coffee'));
    expect(iced.serve).toBe('iced');
    expect(iced.vessel).toBe('glass');
    const frappe = buildForProduct(p('Mocha Frappé'));
    expect(frappe.serve).toBe('blended');
    expect(frappe.vessel).toBe('glass');
    const hot = buildForProduct(p('Cortado', 'Hot Coffee'));
    expect(hot.serve).toBe('hot');
    expect(hot.vessel).toBe('here');
    expect(hot.foam).toBe('flat');
  });

  it('reads black coffee as black', () => {
    expect(buildForProduct(p('Pour Over')).milk).toBe('none');
    expect(buildForProduct(p('Iced Americano')).base).toBe('espresso');
  });
});

describe('withVessel', () => {
  it('never serves a cold drink in a mug', () => {
    const iced = { ...DEFAULT_BUILD, serve: 'iced' as const };
    expect(withVessel(iced, false).vessel).toBe('glass');
    expect(withVessel(iced, true).vessel).toBe('togo');
    expect(withVessel(DEFAULT_BUILD, false).vessel).toBe('here');
  });
});
