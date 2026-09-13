import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RecipesService } from '../../../recipes/application/use-cases/recipes.service';
import { DRINK_CATALOGUE, type DrinkOption } from '../../domain/value-objects/drink-catalogue';
import {
  PRICE_GROUPS,
  applyPrices,
  defaultPriceOf,
  type PriceGroup,
} from '../../domain/value-objects/price-book';

/**
 * What each part of a drink costs, as set from the counter app.
 *
 * Defaults live in drink-catalogue.ts. A row in DrinkOptionPrice overrides one
 * option; removing the row puts the default back. Loaded on boot, before the
 * recipes service syncs product prices, and applied again on every change.
 */
@Injectable()
export class DrinkPricesService implements OnModuleInit {
  private readonly logger = new Logger(DrinkPricesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recipes: RecipesService,
  ) {}

  async onModuleInit() {
    try {
      await this.reload();
    } catch (e) {
      // Without the table the defaults stand, and the API still starts.
      this.logger.warn(`Drink prices not loaded, using defaults: ${(e as Error).message}`);
    }
  }

  /** Every group with its options, their current price and their default. */
  list() {
    return PRICE_GROUPS.map((group) => ({
      group,
      options: (DRINK_CATALOGUE[group] as readonly DrinkOption[]).map((o) => ({
        id: o.id,
        name: o.name,
        note: o.note,
        price: o.price,
        defaultPrice: defaultPriceOf(group, o.id) ?? o.price,
      })),
    }));
  }

  /**
   * Sets one option's price, or resets it to its default with null.
   *
   * Recipe products on the menu take the new price straight away: a recipe
   * without a fixed price costs the sum of its ingredients.
   */
  async update(group: string, optionId: string, price: number | null) {
    if (!PRICE_GROUPS.includes(group as PriceGroup)) {
      throw new NotFoundException(`There is no price group called ${group}`);
    }
    if (defaultPriceOf(group, optionId) === undefined) {
      throw new NotFoundException(`There is no ${optionId} in ${group}`);
    }

    if (price === null) {
      await this.prisma.drinkOptionPrice.deleteMany({ where: { group, optionId } });
    } else {
      await this.prisma.drinkOptionPrice.upsert({
        where: { group_optionId: { group, optionId } },
        update: { price },
        create: { group, optionId, price },
      });
    }

    await this.reload();
    await this.recipes.syncAllProducts();
    return this.list();
  }

  private async reload() {
    const rows = await this.prisma.drinkOptionPrice.findMany();
    applyPrices(
      rows.map((r) => ({ group: r.group, optionId: r.optionId, price: r.price.toNumber() })),
    );
  }
}
