import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Post,
  Patch,
  Body,
  Param,
  Inject,
  UseGuards,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayloadVo } from '../../../auth/domain/value-objects/jwt-payload.vo';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { GetMyOrdersUseCase } from '../../application/use-cases/get-my-orders.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dtos/create-order.dto';
import { OrderMapper } from '../../infrastructure/mappers/order.mapper';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.interface';
import type { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { ReservePickupSlotUseCase } from '../../../reservations/application/use-cases/reserve-pickup-slot.use-case';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getMyOrders: GetMyOrdersUseCase,
    private readonly updateStatus: UpdateOrderStatusUseCase,
    @Inject(ORDER_REPOSITORY) private readonly orders: IOrderRepository,
    private readonly pickup: ReservePickupSlotUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order (PICKUP / TABLE / DELIVERY)' })
  async create(
    @CurrentUser() user: JwtPayloadVo,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    // La misma convención que Stripe: una cabecera, no un campo del cuerpo,
    // porque describe el intento y no el pedido.
    if (idempotencyKey !== undefined && !/^[A-Za-z0-9_-]{8,100}$/.test(idempotencyKey)) {
      throw new BadRequestException('Idempotency-Key must be 8 to 100 safe characters');
    }

    const { order, pickup, replayed } = await this.createOrder.execute({
      ...dto,
      userId: user.sub,
      slotTime: dto.slotTime ? new Date(dto.slotTime) : undefined,
      idempotencyKey,
    });
    return { ...OrderMapper.toResponse(order), pickup, replayed };
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get current user order history' })
  async myOrders(@CurrentUser() user: JwtPayloadVo) {
    const orders = await this.getMyOrders.execute(user.sub);
    return OrderMapper.toResponseList(orders);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'One order with its pickup time',
    description: 'What the tracking screen polls while the bar makes it.',
  })
  async one(@CurrentUser() user: JwtPayloadVo, @Param('id') id: string) {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    // El dueño del pedido y nadie más: el id es adivinable de sobra como
    // para dejar que cualquiera con sesión lea el de otro.
    if (order.userId !== user.sub)
      throw new ForbiddenException('This order belongs to another account');

    const pickup = await this.pickup.forOrder(id);
    return { ...OrderMapper.toResponse(order), pickup };
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
