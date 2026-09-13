import { PrismaClient } from '@prisma/client';

/**
 * Las recetas y los premios que ya existían en el frontend.
 *
 * Se siembran aparte del menú para poder volver a correrlo sin tocar
 * productos ni categorías. El `build` es literalmente el mismo objeto
 * que tenía `apps/web/src/lib/recipes.ts`, así que los pedidos viejos
 * que apuntan a `recipeId: 'latte'` siguen encontrando su receta.
 */

const base = {
  beans: 'house',
  size: 'medium',
  base: 'latte',
  serve: 'hot',
  milk: 'whole',
  foam: 'micro',
  art: 'none',
  extras: [] as string[],
  vessel: 'togo',
  sleeve: 'kraft',
};

const RECIPES = [
  {
    slug: 'espresso',
    name: 'Espresso',
    kind: 'SIGNATURE' as const,
    note: 'Two shots and nothing else. The one a roaster gets judged on.',
    build: { ...base, base: 'espresso', size: 'small', milk: 'none', vessel: 'here' },
    sortOrder: 1,
  },
  {
    slug: 'flat-white',
    name: 'Flat White',
    kind: 'SIGNATURE' as const,
    note: 'A double ristretto under the thinnest milk we can pour.',
    build: { ...base, size: 'small', foam: 'flat', art: 'rosetta', vessel: 'here' },
    sortOrder: 2,
  },
  {
    slug: 'cappuccino',
    name: 'Cappuccino',
    kind: 'SIGNATURE' as const,
    note: 'Dry foam standing above the rim, dusted with cinnamon.',
    build: {
      ...base,
      base: 'espresso',
      size: 'small',
      foam: 'cappuccino',
      vessel: 'here',
      extras: ['cinnamon'],
    },
    sortOrder: 3,
  },
  {
    slug: 'latte',
    name: 'Oat Latte',
    kind: 'SIGNATURE' as const,
    note: 'The one you order most, and the one we pour art into.',
    build: { ...base, milk: 'oat', art: 'heart', vessel: 'here' },
    sortOrder: 4,
  },
  {
    slug: 'cold-brew',
    name: 'Cold Brew',
    kind: 'SIGNATURE' as const,
    note: 'Twenty hours steeping, poured over ice. Smooth, never bitter.',
    build: { ...base, base: 'filter', size: 'large', serve: 'iced', milk: 'none', vessel: 'glass' },
    sortOrder: 5,
  },
  {
    slug: 'matcha',
    name: 'Matcha Latte',
    kind: 'SIGNATURE' as const,
    note: 'Ceremonial grade, whisked, over cold oat milk.',
    build: { ...base, base: 'matcha', serve: 'iced', milk: 'oat', vessel: 'glass' },
    sortOrder: 6,
  },
  {
    slug: 'yuzu-americano',
    name: 'Yuzu Americano',
    accent: '유자',
    kind: 'SEASONAL' as const,
    season: 'Autumn',
    note: 'Korean citrus over a long americano. Bright and sharp.',
    build: { ...base, base: 'yuzu', serve: 'iced', milk: 'none', vessel: 'glass' },
    sortOrder: 1,
  },
  {
    slug: 'hojicha-latte',
    name: 'Hojicha Latte',
    accent: 'ほうじ茶',
    kind: 'SEASONAL' as const,
    season: 'Autumn',
    note: 'Roasted green tea with steamed oat milk. Toasty, barely any caffeine.',
    build: { ...base, base: 'hojicha', milk: 'oat', art: 'tulip', vessel: 'here' },
    sortOrder: 2,
  },
  {
    slug: 'black-sesame',
    name: 'Black Sesame Latte',
    accent: '흑임자',
    kind: 'SEASONAL' as const,
    season: 'Winter',
    note: 'Stone-ground sesame, oat milk and a pinch of sea salt.',
    build: {
      ...base,
      beans: 'sumatra',
      milk: 'oat',
      art: 'rosetta',
      vessel: 'here',
      extras: ['sugar'],
    },
    sortOrder: 3,
  },
  {
    slug: 'fir-cold-brew',
    name: 'Douglas Fir Cold Brew',
    kind: 'SEASONAL' as const,
    season: 'Spring',
    note: 'Cold brew steeped with Douglas fir tips from the Sea-to-Sky.',
    build: {
      ...base,
      base: 'filter',
      beans: 'ethiopia',
      size: 'large',
      serve: 'iced',
      milk: 'none',
      vessel: 'glass',
    },
    sortOrder: 4,
  },
  {
    slug: 'sesame-frappe',
    name: 'Sesame Frappé',
    kind: 'SEASONAL' as const,
    season: 'Summer',
    note: 'The winter latte, blended, with cream and cinnamon on top.',
    build: {
      ...base,
      beans: 'sumatra',
      size: 'large',
      serve: 'blended',
      milk: 'oat',
      vessel: 'glass',
      extras: ['cream', 'cinnamon'],
    },
    sortOrder: 5,
  },
];

/**
 * Lo que se puede canjear.
 *
 * Los costes salen de la política: un punto por dólar, así que 120
 * puntos son unos veinticinco cafés. Caro a propósito. Un premio que se
 * alcanza en tres visitas deja de ser un premio.
 */
const REWARDS = [
  {
    name: 'House coffee',
    formerName: 'Café de la casa',
    description: 'Any small drink',
    cost: 80,
    sortOrder: 1,
  },
  {
    name: 'Any medium drink',
    formerName: 'Bebida mediana a elegir',
    description: 'Whatever you like, in a twelve-ounce size',
    cost: 120,
    sortOrder: 2,
  },
  {
    name: '250g bag of beans',
    formerName: 'Bolsa de grano de 250g',
    description: 'Whichever origin is on the bar that week',
    cost: 300,
    sortOrder: 3,
  },
];

const prisma = new PrismaClient();

async function main() {
  console.log('Sembrando recetas y premios...');

  for (const r of RECIPES) {
    await prisma.recipe.upsert({
      where: { slug: r.slug },
      update: {
        name: r.name,
        note: r.note,
        season: 'season' in r ? r.season : null,
        build: r.build,
        sortOrder: r.sortOrder,
      },
      create: r,
    });
  }

  for (const r of REWARDS) {
    // Se busca también por el nombre antiguo: traducir un premio no puede
    // crear otro al lado del que ya tienen canjeado los clientes.
    const { formerName, ...datos } = r as typeof r & { formerName?: string };
    const existing = await prisma.reward.findFirst({
      where: { name: { in: formerName ? [datos.name, formerName] : [datos.name] } },
    });
    if (existing) {
      await prisma.reward.update({ where: { id: existing.id }, data: datos });
    } else {
      await prisma.reward.create({ data: datos });
    }
  }

  console.log(`Listo: ${RECIPES.length} recetas, ${REWARDS.length} premios.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
