import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Sharp } from 'sharp';
import type { PrismaService } from '../../../prisma/prisma.service';

/**
 * sharp, cargado a mano.
 *
 * Sus tipos describen un módulo ESM donde la función es la exportación por
 * defecto, pero en CommonJS el módulo ES la función. Con `import sharp from`
 * se compila a `sharp_1.default`, que llega undefined; con `import =` los
 * tipos dicen que el espacio de nombres no es llamable. Cargarlo así y
 * declarar la firma resuelve las dos mitades.
 */
const sharp = require('sharp') as (
  input?: Buffer,
  options?: { failOn?: 'none' | 'truncated' | 'error' | 'warning' },
) => Sharp;

/** Lo que se devuelve al CRM para guardarlo en el producto. */
export interface StoredImage {
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  bytes: number;
}

/** Lado mayor de la imagen grande. Un pastel no necesita 4000px. */
const MAX_LADO = 1200;
/** La miniatura de la lista y del carrito. */
const LADO_MINI = 400;
/** Cinco megas. Una foto de móvil cabe de sobra. */
export const MAX_BYTES = 5 * 1024 * 1024;

const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

/** A stored photo's file name: a 16-character content hash, optionally the thumbnail. */
const PHOTO_NAME = /^[a-f0-9]{16}(-sm)?\.webp$/;

/**
 * Las fotos de producto, servidas por el propio backend.
 *
 * No hace falta un servicio de terceros para esto. Una cafetería sube
 * quince fotos al año, y el mismo servidor que ya atiende la API puede
 * servirlas con una cabecera de caché eterna.
 *
 * La clave es el nombre: se calcula del contenido del archivo. Dos subidas
 * de la misma foto dan el mismo nombre y no duplican nada, y como el
 * nombre cambia si cambia la foto, el navegador puede cachearla para
 * siempre sin arriesgarse a servir una vieja. Eso es lo que hace un CDN, y
 * aquí sale gratis.
 */
@Injectable()
export class ImageService implements OnModuleInit {
  private readonly logger = new Logger(ImageService.name);

  constructor(
    /** Folders that may hold photos. Written to the first, read from all. */
    private readonly roots: string[],
    private readonly prisma: PrismaService,
  ) {}

  private get rootDir(): string {
    return this.roots[0];
  }

  /**
   * Photos already on disk go into the database too, once.
   *
   * Anything uploaded before photos were stored in the database, and still
   * sitting in one of the upload folders, becomes servable from the database,
   * so it keeps working after the next redeploy.
   */
  async onModuleInit() {
    let imported = 0;
    for (const root of this.roots) {
      let dirs: string[] = [];
      try {
        dirs = (await readdir(root)).filter((d) => /^[a-f0-9]{2}$/.test(d));
      } catch {
        continue;
      }
      for (const dir of dirs) {
        const files = (await readdir(join(root, dir)).catch(() => [] as string[])).filter((f) =>
          PHOTO_NAME.test(f),
        );
        for (const file of files) {
          const path = `${dir}/${file}`;
          try {
            const known = await this.prisma.storedImage.findUnique({
              where: { path },
              select: { path: true },
            });
            if (known) continue;
            await this.store(path, await readFile(join(root, path)));
            imported++;
          } catch (e) {
            this.logger.warn(`Could not import ${path}: ${(e as Error).message}`);
          }
        }
      }
    }
    if (imported > 0) this.logger.log(`Imported ${imported} photos from disk into the database`);
  }

  /**
   * One photo by its path after /uploads/. Disk first, database after.
   * Undefined when it is in neither, or when the path is not a photo name.
   */
  async read(path: string): Promise<{ contentType: string; data: Buffer } | undefined> {
    const [dir, file] = path.split('/');
    if (!/^[a-f0-9]{2}$/.test(dir ?? '') || !PHOTO_NAME.test(file ?? '')) return undefined;

    for (const root of this.roots) {
      try {
        return { contentType: 'image/webp', data: await readFile(join(root, dir, file)) };
      } catch {
        // Not in this folder.
      }
    }
    const row = await this.prisma.storedImage.findUnique({ where: { path: `${dir}/${file}` } });
    return row ? { contentType: row.contentType, data: Buffer.from(row.data) } : undefined;
  }

  private async store(path: string, data: Buffer) {
    await this.prisma.storedImage.upsert({
      where: { path },
      update: {},
      // Prisma takes bytes backed by a plain ArrayBuffer; a Node Buffer may sit on a
      // shared pool, so it is copied into one.
      create: { path, contentType: 'image/webp', data: new Uint8Array(data) },
    });
  }

  /**
   * Guarda una imagen ya optimizada y devuelve sus URLs.
   *
   * Sale en WebP siempre: pesa entre un tercio y la mitad que un JPEG a
   * la misma calidad y lo entiende cualquier navegador desde 2020. Se
   * quitan los metadatos de paso, que es donde viaja la ubicación GPS de
   * una foto hecha con el móvil.
   */
  async save(buffer: Buffer, mimetype: string): Promise<StoredImage> {
    if (!TIPOS.includes(mimetype)) {
      throw new BadRequestException(
        `That file is not an image we can read (${mimetype}). Use JPG, PNG or WebP.`,
      );
    }
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException(
        `The image is ${Math.round(buffer.length / 1024 / 1024)} MB and the limit is 5 MB.`,
      );
    }

    try {
      await sharp(buffer, { failOn: 'error' }).metadata();
    } catch (error) {
      // Un archivo con extensión de imagen y contenido de otra cosa llega
      // hasta aquí. El tamaño en el mensaje distingue «no es una imagen»
      // de «llegó vacío», que se arreglan de formas muy distintas.
      this.logger.warn(
        `Imagen ilegible: ${buffer.length} bytes, ${mimetype} · ${(error as Error).message}`,
      );
      throw new BadRequestException(
        `The file claims to be an image but cannot be opened (${buffer.length} bytes received).`,
      );
    }

    const grande = await sharp(buffer)
      .rotate() // respeta la orientación EXIF antes de tirar los metadatos
      .resize({ width: MAX_LADO, height: MAX_LADO, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    const mini = await sharp(buffer)
      .rotate()
      .resize({ width: LADO_MINI, height: LADO_MINI, fit: 'cover', position: 'centre' })
      .webp({ quality: 76 })
      .toBuffer();

    // El nombre sale del contenido ya optimizado, así que subir dos veces
    // la misma foto no crea dos archivos.
    const hash = createHash('sha256').update(grande.data).digest('hex').slice(0, 16);
    const dir = join(this.rootDir, hash.slice(0, 2));
    await mkdir(dir, { recursive: true });

    const nombre = `${hash}.webp`;
    const nombreMini = `${hash}-sm.webp`;

    // Si ya existe es la misma foto byte a byte. No se reescribe.
    if (!(await existe(join(dir, nombre)))) {
      await writeFile(join(dir, nombre), grande.data);
      await writeFile(join(dir, nombreMini), mini);
      this.logger.log(
        `Imagen guardada: ${nombre} · ${Math.round(grande.data.length / 1024)} KB ` +
          `(uploaded at ${Math.round(buffer.length / 1024)} KB)`,
      );
    }

    // Kept in the database as well, so the photo survives a redeploy even
    // when the server's disk does not.
    await this.store(`${hash.slice(0, 2)}/${nombre}`, grande.data);
    await this.store(`${hash.slice(0, 2)}/${nombreMini}`, mini);

    const base = `/uploads/${hash.slice(0, 2)}`;
    return {
      url: `${base}/${nombre}`,
      thumbUrl: `${base}/${nombreMini}`,
      width: grande.info.width,
      height: grande.info.height,
      bytes: grande.data.length,
    };
  }
}

async function existe(ruta: string): Promise<boolean> {
  try {
    await access(ruta);
    return true;
  } catch {
    return false;
  }
}
