import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
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
/** What a recipe shows of its product: the menu row it is sold as. */
const PRODUCT = { select: { id: true, imageUrl: true, categoryId: true } } as const;

/** Fields that belong to the product, not the recipe row. */
type ProductFields = { categoryId?: string | null; imageUrl?: string | null };

@Injectable()
export class RecipesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RecipesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Every recipe is sold as a product.
   *
   * On boot, a recipe without one (created before this existed, seeded, or
   * whose product was deleted) gets it, and every linked product takes its
   * price from the formula again, so a change in the ingredient prices reaches
   * the menu without anyone re-saving each recipe. A database that is not
   * reachable yet only logs: the API still starts.
   */
  // After every module's init, so component prices set from the counter app
  // are already applied when product prices are computed.
  async onApplicationBootstrap() {
    try {
      await this.ensureBuilderProduct();
      await this.syncAllProducts();
    } catch (e) {
      this.logger.warn(`Recipe products not synced: ${(e as Error).message}`);
    }
  }

  /** Brings every recipe's product in line: after boot, and after a price change. */
  async syncAllProducts() {
    const rows = await this.prisma.recipe.findMany();
    for (const row of rows) await this.syncProduct(row, {});
  }

  /**
   * The menu row the drink builder orders against.
   *
   * A drink built on the website is recorded as a line of "Build your own",
   * priced by its formula. Without that product the builder could never add a
   * drink to the bag, which is exactly what happened on a fresh database. So
   * it is created on boot when missing, under "Made to order". An existing one
   * is left alone, including if the counter marked it sold out.
   */
  private async ensureBuilderProduct() {
    const existing = await this.prisma.product.findFirst({
      where: { name: { equals: 'Build your own', mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) return;

    const category = await this.prisma.category.upsert({
      where: { name: 'Made to order' },
      update: {},
      create: { name: 'Made to order' },
      select: { id: true },
    });
    const starter: DrinkBuild = {
      beans: 'house',
      size: 'small',
      base: 'latte',
      serve: 'hot',
      milk: 'whole',
      foam: 'micro',
      art: 'none',
      extras: [],
      vessel: 'togo',
      sleeve: 'kraft',
    };
    await this.prisma.product.create({
      data: {
        name: 'Build your own',
        description: 'Your drink, your way. Priced by what you choose.',
        // The starting price shown on the menu; each order is charged its formula.
        price: priceOfBuild(starter),
        categoryId: category.id,
      },
    });
    this.logger.log('Created the Build your own product the drink builder orders against');
  }

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
      include: { product: PRODUCT },
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
      include: { product: PRODUCT },
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
    const row = await this.prisma.recipe.findUnique({
      where: { slug },
      include: { product: PRODUCT },
    });
    if (!row) throw new NotFoundException(`No tenemos ninguna receta llamada ${slug}`);
    return this.decorate(row);
  }

  /** Todas, incluidas las apagadas y las fuera de temporada. Para el CRM. */
  async all() {
    const rows = await this.prisma.recipe.findMany({
      orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }],
      include: { product: PRODUCT },
    });
    return rows.map((r) => this.decorate(r));
  }

  async create(input: Record<string, unknown> & ProductFields) {
    const { categoryId, imageUrl, ...data } = input;
    const row = await this.prisma.recipe.create({ data: data as never });
    await this.syncProduct(row, { categoryId, imageUrl });
    return this.bySlug(row.slug);
  }

  async update(id: string, input: Record<string, unknown> & ProductFields) {
    const { categoryId, imageUrl, ...data } = input;
    const row = await this.prisma.recipe.update({ where: { id }, data: data as never });
    await this.syncProduct(row, { categoryId, imageUrl });
    return this.bySlug(row.slug);
  }

  /**
   * Creates or updates the product a recipe is sold as.
   *
   * Name, description and price always follow the recipe; the price is the
   * formula's, the same figure an order is charged. Availability is left
   * alone on purpose: "sold out" is set on the product from the counter, and
   * the recipe's own switch and dates are applied when the menu is read.
   *
   * A product with the same name that no recipe owns yet is adopted rather
   * than duplicated, so a drink that was already on the menu keeps its photo,
   * its order history and its place.
   */
  private async syncProduct(
    recipe: {
      id: string;
      name: string;
      note: string;
      kind: string;
      build: unknown;
      productId: string | null;
      priceOverride?: { toString(): string } | number | null;
    },
    extra: ProductFields,
  ): Promise<string> {
    const data = {
      name: recipe.name,
      description: recipe.note,
      // The fixed menu price when the owner set one, the formula otherwise.
      price:
        recipe.priceOverride != null
          ? Number(recipe.priceOverride)
          : priceOfBuild(recipe.build as DrinkBuild),
      ...(extra.categoryId ? { categoryId: extra.categoryId } : {}),
      // undefined leaves the photo as it is; null removes it.
      ...(extra.imageUrl !== undefined ? { imageUrl: extra.imageUrl } : {}),
    };

    if (recipe.productId) {
      const linked = await this.prisma.product.findUnique({
        where: { id: recipe.productId },
        select: { id: true },
      });
      if (linked) {
        await this.prisma.product.update({ where: { id: linked.id }, data });
        return linked.id;
      }
    }

    const twin = await this.prisma.product.findFirst({
      where: { name: { equals: recipe.name, mode: 'insensitive' }, recipe: { is: null } },
      select: { id: true },
    });
    const productId = twin
      ? (await this.prisma.product.update({ where: { id: twin.id }, data })).id
      : (
          await this.prisma.product.create({
            data: {
              ...data,
              categoryId: extra.categoryId || (await this.defaultCategory(recipe.kind)),
            },
          })
        ).id;

    await this.prisma.recipe.update({ where: { id: recipe.id }, data: { productId } });
    return productId;
  }

  /** Where a recipe is listed when nobody picked a section for it. */
  private async defaultCategory(kind: string): Promise<string> {
    const name = kind === 'SEASONAL' ? 'Seasonal Drinks' : 'Signature Drinks';
    const category = await this.prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
      select: { id: true },
    });
    return category.id;
  }

  /**
   * Añade lo que se deriva de la fórmula.
   *
   * El precio y el ticket no se guardan en la fila a propósito. Si se
   * guardaran, subir el precio del grano dejaría el menú mintiendo hasta
   * que alguien recalculara cada receta a mano.
   */
  private decorate<
    T extends {
      build: unknown;
      priceOverride?: { toString(): string } | number | null;
      product?: { id: string; imageUrl: string | null; categoryId: string } | null;
    },
  >(row: T) {
    const build = row.build as DrinkBuild;
    return {
      ...row,
      // What the menu charges: the fixed price, or the sum of ingredients.
      price: row.priceOverride != null ? Number(row.priceOverride) : priceOfBuild(build),
      formulaPrice: priceOfBuild(build),
      priceOverride: row.priceOverride != null ? Number(row.priceOverride) : null,
      ticket: describeBuild(build),
      // The product it is sold as: what the web adds to the bag and shows.
      productId: row.product?.id ?? null,
      imageUrl: row.product?.imageUrl ?? null,
      categoryId: row.product?.categoryId ?? null,
    };
  }
}
