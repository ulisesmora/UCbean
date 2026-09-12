import { OrderEntity, OrderStatus, OrderType } from '../entities/order.entity';
import type { DrinkBuild } from '../value-objects/drink-build';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface CreateOrderData {
  userId: string;
  type: OrderType;
  notes?: string;
  deliveryAddressId?: string;
  items: {
    productId: string;
    qty: number;
    unitPrice: number;
    build?: DrinkBuild;
    recipeId?: string;
    name?: string;
    ticket?: string;
  }[];
}

export interface IOrderRepository {
  findById(id: string): Promise<OrderEntity | null>;
  findByUser(userId: string): Promise<OrderEntity[]>;
  create(data: CreateOrderData): Promise<OrderEntity>;
  updateStatus(id: string, status: OrderStatus, note?: string): Promise<OrderEntity>;
}
