import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    const updated = await this.orders.transition(id, order.status, status, note);

    // Dos personas en la barra pulsan a la vez. La segunda no puede avanzar
    // un pedido que ya no está donde ella lo vio: se le dice, y su pantalla
    // se recarga con el estado real.
    if (!updated) {
      throw new ConflictException('Someone just changed this order. Check where it is now.');
    }

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
