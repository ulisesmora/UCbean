import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/repositories/order.repository.interface';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../products/domain/repositories/product.repository.interface';
import { OrderEntity, OrderType } from '../../domain/entities/order.entity';

export interface CreateOrderInput {
  userId: string;
  type: OrderType;
  notes?: string;
  deliveryAddressId?: string;
  items: { productId: string; qty: number }[];
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: IOrderRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository,
  ) {}

  async execute(input: CreateOrderInput): Promise<OrderEntity> {
    if (!input.items.length) {
      throw new BadRequestException('Order must have at least one item');
    }

    const resolvedItems = await Promise.all(
      input.items.map(async ({ productId, qty }) => {
        const product = await this.products.findById(productId);
        if (!product) throw new NotFoundException(`Product ${productId} not found`);
        if (!product.isAvailable) {
          throw new BadRequestException(`Product "${product.name}" is not available`);
        }
        return { productId, qty, unitPrice: product.price };
      }),
    );

    return this.orders.create({
      userId: input.userId,
      type: input.type,
      notes: input.notes,
      deliveryAddressId: input.deliveryAddressId,
      items: resolvedItems,
    });
  }
}
