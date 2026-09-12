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
    note: 'Dos shots y nada más. Con el que se juzga a un tostador.',
    build: { ...base, base: 'espresso', size: 'small', milk: 'none', vessel: 'here' },
    sortOrder: 1,
  },
  {
    slug: 'flat-white',
    name: 'Flat White',
    kind: 'SIGNATURE' as const,
    note: 'Doble ristretto bajo la capa de leche más fina posible.',
    build: { ...base, size: 'small', foam: 'flat', art: 'rosetta', vessel: 'here' },
    sortOrder: 2,
  },
  {
    slug: 'cappuccino',
    name: 'Cappuccino',
    kind: 'SIGNATURE' as const,
    note: 'Espuma seca por encima del borde, con canela.',
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
    note: 'El más pedido, y en el que dibujamos.',
    build: { ...base, milk: 'oat', art: 'heart', vessel: 'here' },
    sortOrder: 4,
  },
  {
    slug: 'cold-brew',
    name: 'Cold Brew',
    kind: 'SIGNATURE' as const,
    note: 'Veinte horas de reposo, servido con hielo. Suave, nunca amargo.',
    build: { ...base, base: 'filter', size: 'large', serve: 'iced', milk: 'none', vessel: 'glass' },
    sortOrder: 5,
  },
  {
    slug: 'matcha',
    name: 'Matcha Latte',
    kind: 'SIGNATURE' as const,
    note: 'Grado ceremonial, batido, sobre leche de avena fría.',
    build: { ...base, base: 'matcha', serve: 'iced', milk: 'oat', vessel: 'glass' },
    sortOrder: 6,
  },
  {
    slug: 'yuzu-americano',
    name: 'Yuzu Americano',
    accent: '유자',
    kind: 'SEASONAL' as const,
    season: 'Otoño',
    note: 'Cítrico coreano sobre un americano largo. Brillante y ácido.',
    build: { ...base, base: 'yuzu', serve: 'iced', milk: 'none', vessel: 'glass' },
    sortOrder: 1,
  },
  {
    slug: 'hojicha-latte',
    name: 'Hojicha Latte',
    accent: 'ほうじ茶',
    kind: 'SEASONAL' as const,
    season: 'Otoño',
    note: 'Té verde tostado y leche de avena al vapor. Tostado, poca cafeína.',
    build: { ...base, base: 'hojicha', milk: 'oat', art: 'tulip', vessel: 'here' },
    sortOrder: 2,
  },
  {
    slug: 'black-sesame',
    name: 'Black Sesame Latte',
    accent: '흑임자',
    kind: 'SEASONAL' as const,
    season: 'Invierno',
    note: 'Ajonjolí molido en piedra, avena y una pizca de sal de mar.',
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
    season: 'Primavera',
    note: 'Cold brew infusionado con brotes de abeto de la Sea-to-Sky.',
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
    season: 'Verano',
    note: 'El latte de invierno, licuado, con nata y canela encima.',
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
    name: 'Café de la casa',
    description: 'Cualquier bebida de tamaño pequeño',
    cost: 80,
    sortOrder: 1,
  },
  {
    name: 'Bebida mediana a elegir',
    description: 'La que quieras, del tamaño de doce onzas',
    cost: 120,
    sortOrder: 2,
  },
  {
    name: 'Bolsa de grano de 250g',
    description: 'El origen que esté en barra esa semana',
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
      update: { name: r.name, note: r.note, build: r.build, sortOrder: r.sortOrder },
      create: r,
    });
  }

  for (const r of REWARDS) {
    const existing = await prisma.reward.findFirst({ where: { name: r.name } });
    if (existing) {
      await prisma.reward.update({ where: { id: existing.id }, data: r });
    } else {
      await prisma.reward.create({ data: r });
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
