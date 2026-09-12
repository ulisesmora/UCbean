import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';

const prisma = new PrismaClient();

const MENU = [
  {
    category: 'Hot Coffee',
    products: [
      { name: 'Espresso', price: 3.5, description: 'Double shot, bright and clean' },
      { name: 'Cortado', price: 4.25, description: 'Equal parts espresso and steamed milk' },
      { name: 'Flat White', price: 5.0, description: 'Velvety microfoam, ristretto base' },
      { name: 'Latte', price: 5.5, description: 'Smooth and creamy, ask for oat milk' },
    ],
  },
  {
    category: 'Iced Coffee',
    products: [
      { name: 'Iced Americano', price: 4.5, description: 'Cold water over double espresso' },
      {
        name: 'Yuzu Americano',
        price: 5.5,
        description: 'Our signature — yuzu citrus, espresso, sparkling water',
      },
      { name: 'Cold Brew', price: 5.0, description: '18-hour steep, smooth and low-acid' },
      { name: 'Iced Latte', price: 5.75, description: 'Espresso, milk, ice — simple done right' },
    ],
  },
  {
    // The anchor for anything made in the configurator. One catalogue row, and
    // the formula that makes each one different rides along on the order line.
    // Priced at zero because the build sets the price, never the shelf.
    category: 'Made to order',
    products: [
      {
        name: 'Build your own',
        price: 0,
        description: 'Beans, size, milk, foam and extras, exactly how you want them',
      },
    ],
  },
  {
    category: 'Filter Coffee',
    products: [
      { name: 'Pour Over', price: 5.5, description: 'Single origin, brewed to order' },
      { name: 'Batch Brew', price: 3.75, description: 'House filter, refills welcome' },
      { name: 'Aeropress', price: 5.0, description: 'Full body, clean finish' },
    ],
  },
  {
    category: 'Whole Beans',
    products: [
      {
        name: 'Ethiopia Yirgacheffe',
        price: 22.0,
        description: '250g — blueberry, jasmine, bergamot',
      },
      {
        name: 'Colombia Huila',
        price: 20.0,
        description: '250g — caramel, red apple, brown sugar',
      },
      {
        name: 'House Blend',
        price: 18.0,
        description: '250g — chocolatey, balanced, great as espresso',
      },
    ],
  },
];

/**
 * A stable UUID for a seeded row.
 *
 * The seed has to be re-runnable, which needs an id it can derive rather than
 * invent. It used to build a readable string like `seed-<cat>-latte`, but the
 * order API validates product ids as UUIDs, so nothing seeded could actually
 * be ordered. This is a name-based UUID (version 5, the standard construction:
 * SHA-1 of a namespace plus a name, with the version and variant bits set), so
 * the ids are stable across runs and still real UUIDs.
 */
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // RFC 4122 DNS namespace
function stableUuid(name: string): string {
  const ns = Buffer.from(NAMESPACE.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1')
    .update(Buffer.concat([ns, Buffer.from(name)]))
    .digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = hash.subarray(0, 16).toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

async function main() {
  console.log('Seeding menu...');

  for (const section of MENU) {
    const cat = await prisma.category.upsert({
      where: { name: section.category },
      update: {},
      create: { name: section.category },
    });

    for (const p of section.products) {
      const id = stableUuid(`ucbean:product:${section.category}:${p.name}`);
      await prisma.product.upsert({
        where: { id },
        update: { price: p.price, description: p.description },
        create: {
          id,
          categoryId: cat.id,
          name: p.name,
          price: p.price,
          description: p.description,
        },
      });
    }
  }

  // Seed a few tables
  const tables = [
    { number: 1, capacity: 2, zone: 'indoor' },
    { number: 2, capacity: 2, zone: 'indoor' },
    { number: 3, capacity: 4, zone: 'indoor' },
    { number: 4, capacity: 4, zone: 'indoor' },
    { number: 5, capacity: 6, zone: 'indoor' },
    { number: 6, capacity: 4, zone: 'terrace' },
    { number: 7, capacity: 4, zone: 'terrace' },
    { number: 8, capacity: 6, zone: 'terrace' },
  ];

  for (const t of tables) {
    await prisma.table.upsert({
      where: { number: t.number },
      update: {},
      create: t,
    });
  }

  console.log('Seed complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
