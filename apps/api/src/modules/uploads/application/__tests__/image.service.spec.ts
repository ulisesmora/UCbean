import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ImageService } from '../image.service';

const NAME = 'ae7da13f6eabe35f.webp';

/** A database with just the StoredImage table, kept in a map. */
function fakePrisma() {
  const rows = new Map<string, { path: string; contentType: string; data: Uint8Array }>();
  return {
    rows,
    storedImage: {
      findUnique: jest.fn(
        async ({ where }: { where: { path: string } }) => rows.get(where.path) ?? null,
      ),
      upsert: jest.fn(
        async ({
          where,
          create,
        }: {
          where: { path: string };
          create: { path: string; contentType: string; data: Uint8Array };
        }) => {
          if (!rows.has(where.path)) rows.set(where.path, create);
          return rows.get(where.path);
        },
      ),
    },
  };
}

const folder = (prefix: string) => mkdtempSync(join(tmpdir(), prefix));

describe('ImageService photos', () => {
  it('serves a photo from the second folder when the first does not have it', async () => {
    const volume = folder('vol-');
    const local = folder('app-');
    mkdirSync(join(local, 'ae'));
    writeFileSync(join(local, 'ae', NAME), 'webp-bytes');

    const images = new ImageService([volume, local], fakePrisma() as never);
    const found = await images.read(`ae/${NAME}`);
    expect(found?.data.toString()).toBe('webp-bytes');
  });

  it('falls back to the database when no folder has the file', async () => {
    const prisma = fakePrisma();
    prisma.rows.set(`ae/${NAME}`, {
      path: `ae/${NAME}`,
      contentType: 'image/webp',
      data: Buffer.from('from-db'),
    });

    const images = new ImageService([folder('empty-')], prisma as never);
    const found = await images.read(`ae/${NAME}`);
    expect(found?.data.toString()).toBe('from-db');
    expect(found?.contentType).toBe('image/webp');
  });

  it('imports photos found on disk into the database on boot, once', async () => {
    const root = folder('disk-');
    mkdirSync(join(root, 'ae'));
    writeFileSync(join(root, 'ae', NAME), 'x');
    writeFileSync(join(root, 'ae', 'notes.txt'), 'not a photo');

    const prisma = fakePrisma();
    const images = new ImageService([root], prisma as never);
    await images.onModuleInit();
    await images.onModuleInit();

    expect(prisma.rows.has(`ae/${NAME}`)).toBe(true);
    expect(prisma.rows.size).toBe(1);
    expect(prisma.storedImage.upsert).toHaveBeenCalledTimes(1);
  });

  it('refuses anything that is not a photo name', async () => {
    const images = new ImageService([tmpdir()], fakePrisma() as never);
    expect(await images.read('../etc/passwd')).toBeUndefined();
    expect(await images.read('ae/../../secret.webp')).toBeUndefined();
    expect(await images.read('ae/notes.txt')).toBeUndefined();
  });
});
