import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/repositories/order.repository.interface';
import { OrderEntity, OrderStatus } from '../../domain/entities/order.entity';
import { EVENTS, type OrderStatusChangedEvent } from '../../../../common/events/domain-events';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: IOrderRepository,
    private readonly events: EventEmitter2,
  ) {}

  async execute(id: string, status: OrderStatus, note?: string): Promise<OrderEntity> {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    if (!order.canTransitionTo(status)) {
      throw new BadRequestException(`Cannot transition order from ${order.status} to ${status}`);
    }

    const updated = await this.orders.updateStatus(id, status, note);

    // De aquí cuelgan el aviso al cliente y los puntos del pedido. Los
    // dos van después de escribir, nunca antes.
    this.events.emit(EVENTS.orderStatusChanged, {
      orderId: updated.id,
      userId: updated.userId,
      status: updated.status,
      total: updated.total,
    } satisfies OrderStatusChangedEvent);

    return updated;
  }
}
