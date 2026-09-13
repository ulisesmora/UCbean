import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';

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
  }): Product {
    return new Product(
      r.id,
      r.categoryId,
      r.name,
      r.price.toNumber(),
      r.isAvailable,
      r.description,
      r.imageUrl,
      r.createdAt,
      r.updatedAt,
      r.category ? { id: r.category.id, name: r.category.name } : null,
    );
  }

  async findAll(categoryId?: string): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { name: 'asc' },
      include: { category: { select: { id: true, name: true } } },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<Product | null> {
    const r = await this.prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
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
