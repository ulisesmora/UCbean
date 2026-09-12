import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import type { DrinkBuild } from '../../../orders/domain/value-objects/drink-build';
import { describeBuild, priceOfBuild } from '../../../orders/domain/value-objects/drink-price';

/**
 * El menú, expresado como fórmulas.
 *
 * Una receta no es un nombre y un precio: es un `build`, el mismo objeto
 * que produce el configurador y que se copia en la línea de pedido. Por
 * eso el precio se calcula y no se teclea, y por eso el menú y el
 * configurador no pueden discrepar sobre cuánto cuesta un latte.
 */
@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lo que se sirve hoy.
   *
   * Una receta de temporada con fechas solo aparece dentro de su ventana.
   * Así el dueño programa la bebida de otoño en agosto y se publica sola.
   */
  async current(kind?: 'SIGNATURE' | 'SEASONAL') {
    const now = new Date();
    const rows = await this.prisma.recipe.findMany({
      where: {
        isActive: true,
        ...(kind ? { kind } : {}),
        AND: [
          { OR: [{ activeFrom: null }, { activeFrom: { lte: now } }] },
          { OR: [{ activeTo: null }, { activeTo: { gte: now } }] },
        ],
      },
      orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((r) => this.decorate(r));
  }

  async bySlug(slug: string) {
    const row = await this.prisma.recipe.findUnique({ where: { slug } });
    if (!row) throw new NotFoundException(`No tenemos ninguna receta llamada ${slug}`);
    return this.decorate(row);
  }

  /** Todas, incluidas las apagadas y las fuera de temporada. Para el CRM. */
  async all() {
    const rows = await this.prisma.recipe.findMany({
      orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }],
    });
    return rows.map((r) => this.decorate(r));
  }

  async create(data: Record<string, unknown>) {
    const row = await this.prisma.recipe.create({ data: data as never });
    return this.decorate(row);
  }

  async update(id: string, data: Record<string, unknown>) {
    const row = await this.prisma.recipe.update({ where: { id }, data: data as never });
    return this.decorate(row);
  }

  /**
   * Añade lo que se deriva de la fórmula.
   *
   * El precio y el ticket no se guardan en la fila a propósito. Si se
   * guardaran, subir el precio del grano dejaría el menú mintiendo hasta
   * que alguien recalculara cada receta a mano.
   */
  private decorate<T extends { build: unknown }>(row: T) {
    const build = row.build as DrinkBuild;
    return { ...row, price: priceOfBuild(build), ticket: describeBuild(build) };
  }
}
