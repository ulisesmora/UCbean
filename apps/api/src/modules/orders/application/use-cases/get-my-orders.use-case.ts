import { Inject, Injectable } from '@nestjs/common';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';

@Injectable()
export class GetMyOrdersUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: IOrderRepository) {}

  execute(userId: string): Promise<OrderEntity[]> {
    return this.orders.findByUser(userId);
  }
}
