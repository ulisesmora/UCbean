import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { isRecipeLive } from '../../../recipes/domain/recipe-window';

/** What a product needs to know about the recipe it is, when it is one. */
const RECIPE = {
  select: { slug: true, build: true, isActive: true, activeFrom: true, activeTo: true },
} as const;

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(r: {
    id: string;
    categoryId: string;
    name: string;
    price: { toNumber(): number };
    isAvailable: boolean;
    description: string | null;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    category?: { id: string; name: string } | null;
    recipe?: {
      slug: string;
      build: unknown;
      isActive: boolean;
      activeFrom: Date | null;
      activeTo: Date | null;
    } | null;
  }): Product {
    return new Product(
      r.id,
      r.categoryId,
      r.name,
      r.price.toNumber(),
      // A recipe product is on sale only while its recipe is switched on and in
      // season, on top of the counter's own sold-out flag. Checked here, so the
      // menu and the order both see the same answer.
      r.isAvailable && (r.recipe ? isRecipeLive(r.recipe) : true),
      r.description,
      r.imageUrl,
      r.createdAt,
      r.updatedAt,
      r.category ? { id: r.category.id, name: r.category.name } : null,
      r.recipe ? { slug: r.recipe.slug, build: r.recipe.build } : null,
    );
  }

  async findAll(categoryId?: string): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { name: 'asc' },
      include: { category: { select: { id: true, name: true } }, recipe: RECIPE },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<Product | null> {
    const r = await this.prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } }, recipe: RECIPE },
    });
    return r ? this.toEntity(r) : null;
  }

  async create(data: {
    categoryId: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
  }): Promise<Product> {
    const r = await this.prisma.product.create({ data });
    return this.toEntity(r);
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      price: number;
      description: string;
      imageUrl: string;
      isAvailable: boolean;
      categoryId: string;
    }>,
  ): Promise<Product> {
    const r = await this.prisma.product.update({ where: { id }, data });
    return this.toEntity(r);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }
}
