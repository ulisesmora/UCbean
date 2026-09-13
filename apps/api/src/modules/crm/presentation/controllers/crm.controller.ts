import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CounterService } from '../../application/use-cases/counter.service';
import { CreateStaffDto, SetRoleDto } from '../dtos/crm.dto';

/**
 * Lo que ve el mostrador.
 *
 * Todo aquí es para el personal, nunca para el cliente, así que el guardia
 * de roles va en la clase y no en cada método: añadir una ruta nueva sin
 * protección tendría que ser una decisión explícita, no un olvido.
 */
@ApiTags('CRM')
@ApiBearerAuth()
@Controller('crm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'STAFF')
export class CrmController {
  constructor(private readonly counter: CounterService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Numbers for today: sales, collected, queue and new customers' })
  summary() {
    return this.counter.summary();
  }

  @Get('queue')
  @ApiOperation({
    summary: 'The bar queue',
    description: 'What needs making now, oldest first.',
  })
  queue() {
    return this.counter.queue();
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'One order with its status history and payment' })
  orderDetail(@Param('id') id: string) {
    return this.counter.orderDetail(id);
  }

  @Get('top-drinks')
  @ApiOperation({ summary: 'Most ordered drinks, counted from what was made' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  topDrinks(@Query('days') days?: string) {
    return this.counter.topDrinks(Number(days) || 7);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Sales per day, including days with no sales' })
  @ApiQuery({ name: 'days', required: false, example: 14 })
  sales(@Query('days') days?: string) {
    return this.counter.salesByDay(Number(days) || 14);
  }

  @Get('customers')
  @ApiOperation({
    summary: 'Customers with points, spend and last visit',
    description: 'Without this there was no way to find someone to adjust their points.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'By name or email' })
  customers(@Query('search') search?: string) {
    return this.counter.customers(search?.trim() || undefined);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'One customer with orders, points and redemptions' })
  customerDetail(@Param('id') id: string) {
    return this.counter.customerDetail(id);
  }

  @Get('orders')
  @ApiOperation({
    summary: 'Historial de pedidos',
    description: 'The queue only shows live orders. This is for finding an older one.',
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  @ApiQuery({ name: 'search', required: false, description: 'By customer name' })
  orders(
    @Query('status') status?: string,
    @Query('days') days?: string,
    @Query('search') search?: string,
  ) {
    return this.counter.orderHistory({
      status: status || undefined,
      days: Number(days) || 7,
      search: search?.trim() || undefined,
    });
  }

  @Get('payments')
  @ApiOperation({
    summary: 'Cash: card payments and what was paid at the counter',
    description: 'Counter payments leave no Payment row, so they are counted separately.',
  })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  payments(@Query('days') days?: string) {
    return this.counter.payments(Number(days) || 7);
  }

  @Get('staff')
  @ApiOperation({ summary: 'Who can access the counter' })
  staff() {
    return this.counter.staff();
  }

  @Post('staff')
  @Roles('OWNER')
  @ApiOperation({
    summary: 'Add a team member (OWNER only)',
    description:
      'If they already have a customer account it is promoted without touching the password. ' +
      'Adding staff cannot be left to the bar.',
  })
  createStaff(@Body() dto: CreateStaffDto) {
    return this.counter.createStaff(dto);
  }

  @Patch('staff/:id/role')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Cambiar el rol de alguien (solo OWNER)' })
  setRole(@Param('id') id: string, @Body() dto: SetRoleDto) {
    return this.counter.setRole(id, dto.role);
  }

  @Get('sales-report')
  @ApiOperation({
    summary: 'Sales report: by day, category, product, type and payment method',
    description: 'Everything comes from one query, so the numbers always agree.',
  })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  salesReport(@Query('days') days?: string) {
    return this.counter.salesReport(Number(days) || 30);
  }

  @Get('tables')
  @ApiOperation({ summary: 'Table bookings from today onwards' })
  tables() {
    return this.counter.tableReservations();
  }

  @Patch('tables/:id/status')
  @ApiOperation({ summary: 'Confirm, seat, complete or cancel a booking' })
  setTableStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.counter.setReservationStatus(id, body.status);
  }
}
