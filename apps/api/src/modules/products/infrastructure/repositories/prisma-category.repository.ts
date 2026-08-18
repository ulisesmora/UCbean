import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({ orderBy: { name: 'asc' } });
    return rows.map((r) => new Category(r.id, r.name));
  }

  async findById(id: string): Promise<Category | null> {
    const r = await this.prisma.category.findUnique({ where: { id } });
    return r ? new Category(r.id, r.name) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    const r = await this.prisma.category.findUnique({ where: { name } });
    return r ? new Category(r.id, r.name) : null;
  }

  async create(name: string): Promise<Category> {
    const r = await this.prisma.category.create({ data: { name } });
    return new Category(r.id, r.name);
  }
}
