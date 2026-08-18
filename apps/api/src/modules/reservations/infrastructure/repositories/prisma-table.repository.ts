import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  ITableRepository,
  TableRecord,
} from '../../domain/repositories/table.repository.interface';

@Injectable()
export class PrismaTableRepository implements ITableRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailable(minCapacity: number, excludeIds: string[]): Promise<TableRecord | null> {
    const row = await (this.prisma as any).table.findFirst({
      where: {
        isActive: true,
        capacity: { gte: minCapacity },
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
      },
      orderBy: { capacity: 'asc' },
    });
    return row ?? null;
  }
}
