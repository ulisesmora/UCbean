import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { GetMyOrdersUseCase } from '../../application/use-cases/get-my-orders.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dtos/create-order.dto';
import { OrderMapper } from '../../infrastructure/mappers/order.mapper';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getMyOrders: GetMyOrdersUseCase,
    private readonly updateStatus: UpdateOrderStatusUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order (PICKUP / TABLE / DELIVERY)' })
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateOrderDto) {
    const order = await this.createOrder.execute({ userId: user.id, ...dto });
    return OrderMapper.toResponse(order);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get current user order history' })
  async myOrders(@CurrentUser() user: { id: string }) {
    const orders = await this.getMyOrders.execute(user.id);
    return OrderMapper.toResponseList(orders);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Advance order through status machine (OWNER / STAFF only)' })
  async changeStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    const order = await this.updateStatus.execute(id, dto.status as any, dto.note);
    return OrderMapper.toResponse(order);
  }
}
