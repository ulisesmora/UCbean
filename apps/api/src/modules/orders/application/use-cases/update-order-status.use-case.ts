import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/repositories/order.repository.interface';
import { OrderEntity, OrderStatus } from '../../domain/entities/order.entity';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: IOrderRepository) {}

  async execute(id: string, status: OrderStatus, note?: string): Promise<OrderEntity> {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    if (!order.canTransitionTo(status)) {
      throw new BadRequestException(`Cannot transition order from ${order.status} to ${status}`);
    }

    return this.orders.updateStatus(id, status, note);
  }
}
