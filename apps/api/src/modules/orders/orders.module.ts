import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { ORDER_REPOSITORY } from './domain/repositories/order.repository.interface';
import { PrismaOrderRepository } from './infrastructure/repositories/prisma-order.repository';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { GetMyOrdersUseCase } from './application/use-cases/get-my-orders.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { OrdersController } from './presentation/controllers/orders.controller';

@Module({
  imports: [PrismaModule, ProductsModule],
  controllers: [OrdersController],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: PrismaOrderRepository },
    CreateOrderUseCase,
    GetMyOrdersUseCase,
    UpdateOrderStatusUseCase,
  ],
})
export class OrdersModule {}
