import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/repositories/order.repository.interface';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../products/domain/repositories/product.repository.interface';
import { OrderEntity, OrderType } from '../../domain/entities/order.entity';
import type { DrinkBuild } from '../../domain/value-objects/drink-build';
import { priceOfBuild } from '../../domain/value-objects/drink-price';
import { ReservePickupSlotUseCase } from '../../../reservations/application/use-cases/reserve-pickup-slot.use-case';
import { PickupReservation } from '../../../reservations/domain/entities/pickup-reservation.entity';
import { EVENTS, type OrderPlacedEvent } from '../../../../common/events/domain-events';

export interface CreateOrderInput {
  userId: string;
  type: OrderType;
  notes?: string;
  deliveryAddressId?: string;
  /** Required for PICKUP. When the customer is coming to collect it. */
  slotTime?: Date;
  items: {
    productId: string;
    qty: number;
    build?: DrinkBuild;
    recipeId?: string;
    name?: string;
    ticket?: string;
  }[];
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: IOrderRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository,
    private readonly pickup: ReservePickupSlotUseCase,
    private readonly events: EventEmitter2,
  ) {}

  async execute(
    input: CreateOrderInput,
  ): Promise<{ order: OrderEntity; pickup: PickupReservation | null }> {
    if (!input.items.length) {
      throw new BadRequestException('Order must have at least one item');
    }

    // Everything that can be rejected is checked before a row is written, so a
    // bad request leaves nothing behind.
    if (input.type === 'PICKUP') {
      if (!input.slotTime) throw new BadRequestException('Pick a collection time');
      await this.pickup.assertOpen(input.slotTime);
    }

    const resolvedItems = await Promise.all(
      input.items.map(async (item) => {
        const product = await this.products.findById(item.productId);
        if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
        if (!product.isAvailable) {
          throw new BadRequestException(`Product "${product.name}" is not available`);
        }
        // Price is ours, never the client's. A built drink is priced by its
        // formula, which is what makes a large oat latte with a swan cost more
        // than a small black coffee off the same catalogue row. Anything not
        // built is priced off the shelf.
        return {
          ...item,
          unitPrice: item.build ? priceOfBuild(item.build) : product.price,
          name: item.name ?? product.name,
        };
      }),
    );

    const order = await this.orders.create({
      userId: input.userId,
      type: input.type,
      notes: input.notes,
      deliveryAddressId: input.deliveryAddressId,
      items: resolvedItems,
    });

    const reservation =
      input.type === 'PICKUP' && input.slotTime
        ? await this.pickup.execute(order.id, input.slotTime)
        : null;

    this.events.emit(EVENTS.orderPlaced, {
      orderId: order.id,
      userId: order.userId,
      total: order.total,
      // El ticket de cada línea, que es lo que el cliente reconoce en el
      // correo. Sin él el aviso diría solo un total y una hora.
      lines: order.items.map(
        (i) => `${i.qty} x ${i.name ?? 'Bebida'}${i.ticket ? ` (${i.ticket})` : ''}`,
      ),
      slotTime: reservation?.slotTime,
      confirmationCode: reservation?.confirmationCode,
    } satisfies OrderPlacedEvent);

    return { order, pickup: reservation };
  }
}
