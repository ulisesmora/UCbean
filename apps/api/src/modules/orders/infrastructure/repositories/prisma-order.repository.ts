import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  IOrderRepository,
  CreateOrderData,
} from '../../domain/repositories/order.repository.interface';
import { OrderEntity, OrderItemEntity, OrderStatus } from '../../domain/entities/order.entity';
import type { DrinkBuild } from '../../domain/value-objects/drink-build';

type PrismaOrderFull = {
  id: string;
  userId: string;
  type: string;
  status: string;
  total: { toNumber(): number };
  notes: string | null;
  deliveryAddressId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    productId: string;
    qty: number;
    unitPrice: { toNumber(): number };
    options: unknown;
    recipeId: string | null;
    nameSnapshot: string | null;
    ticketSnapshot: string | null;
  }[];
};

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(r: PrismaOrderFull): OrderEntity {
    const items = r.items.map(
      (i) =>
        new OrderItemEntity(
          i.id,
          i.productId,
          i.qty,
          i.unitPrice.toNumber(),
          (i.options as DrinkBuild | null) ?? null,
          i.recipeId,
          i.nameSnapshot,
          i.ticketSnapshot,
        ),
    );
    return new OrderEntity(
      r.id,
      r.userId,
      r.type as any,
      r.status as any,
      r.total.toNumber(),
      items,
      r.notes,
      r.deliveryAddressId,
      r.createdAt,
      r.updatedAt,
    );
  }

  private get include() {
    return { items: true };
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const r = await this.prisma.order.findUnique({ where: { id }, include: this.include });
    return r ? this.toEntity(r as any) : null;
  }

  async findByUser(userId: string): Promise<OrderEntity[]> {
    const rows = await this.prisma.order.findMany({
      where: { userId },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r as any));
  }

  async create(data: CreateOrderData): Promise<OrderEntity> {
    const total = data.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
    const r = await this.prisma.order.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        total,
        notes: data.notes,
        deliveryAddressId: data.deliveryAddressId,
        items: {
          create: data.items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            unitPrice: i.unitPrice,
            // The build is a plain object of strings and string arrays, which
            // is valid JSON, but an interface carries no index signature so
            // Prisma's InputJsonValue cannot see that. The cast says so.
            options: (i.build ?? undefined) as Prisma.InputJsonValue | undefined,
            recipeId: i.recipeId,
            nameSnapshot: i.name,
            ticketSnapshot: i.ticket,
          })),
        },
        statusHistory: { create: { status: 'PENDING' } },
      },
      include: this.include,
    });
    return this.toEntity(r as any);
  }

  async updateStatus(id: string, status: OrderStatus, note?: string): Promise<OrderEntity> {
    const r = await this.prisma.order.update({
      where: { id },
      data: {
        status: status as any,
        statusHistory: { create: { status: status as any, note } },
      },
      include: this.include,
    });
    return this.toEntity(r as any);
  }
}
