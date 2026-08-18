import { PrismaClient } from '@prisma/client';

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

async function main() {
  console.log('Seeding menu...');

  for (const section of MENU) {
    const cat = await prisma.category.upsert({
      where: { name: section.category },
      update: {},
      create: { name: section.category },
    });

    for (const p of section.products) {
      await prisma.product.upsert({
        where: { id: `seed-${cat.id}-${p.name.replace(/\s+/g, '-').toLowerCase()}` },
        update: { price: p.price, description: p.description },
        create: {
          id: `seed-${cat.id}-${p.name.replace(/\s+/g, '-').toLowerCase()}`,
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
