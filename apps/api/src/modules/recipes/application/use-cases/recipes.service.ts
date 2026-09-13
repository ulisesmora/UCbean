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

  /**
   * Las más pedidas, de verdad.
   *
   * Se cuenta sobre `OrderItem.recipeId`, que es la huella que deja una
   * receta al pedirse, no sobre un contador en la fila: un contador hay
   * que acordarse de subirlo y se desincroniza el día que alguien cancela
   * un pedido a mano.
   *
   * La ventana existe porque «lo más vendido» de hace un año no es una
   * recomendación, es historia. Y los pedidos cancelados no cuentan: nadie
   * se bebió esos.
   *
   * ponytail: un groupBy por consulta. Con el volumen de una cafetería de
   * campus sobra; si algún día pesa, esto es una vista materializada que
   * se refresca por la noche.
   */
  async bestSellers(days = 30, limit = 6) {
    const desde = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const ventas = await this.prisma.orderItem.groupBy({
      by: ['recipeId'],
      where: {
        recipeId: { not: null },
        order: { createdAt: { gte: desde }, status: { not: 'CANCELLED' } },
      },
      _sum: { qty: true },
      orderBy: { _sum: { qty: 'desc' } },
      take: limit,
    });

    if (ventas.length === 0) return [];

    // `recipeId` guarda el slug, que es lo que viaja en la línea de pedido.
    const slugs = ventas.map((v) => v.recipeId!).filter(Boolean);
    const recetas = await this.prisma.recipe.findMany({
      where: { slug: { in: slugs }, isActive: true },
    });

    // Se reordena según las ventas: el `findMany` devuelve en su orden, no
    // en el del ranking, y el ranking es justo lo que se está enseñando.
    const porSlug = new Map(recetas.map((r) => [r.slug, r]));
    return ventas
      .map((v) => {
        const receta = porSlug.get(v.recipeId!);
        return receta ? { ...this.decorate(receta), sold: v._sum.qty ?? 0 } : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
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
