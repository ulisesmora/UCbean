import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { GetAvailableSlotsUseCase } from '../../application/use-cases/get-available-slots.use-case';
import { CreateTableReservationUseCase } from '../../application/use-cases/create-table-reservation.use-case';
import { GetMyTableReservationsUseCase } from '../../application/use-cases/get-my-table-reservations.use-case';
import { TableReservationDto } from '../dtos/reservations.dto';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly getSlots: GetAvailableSlotsUseCase,
    private readonly createTable: CreateTableReservationUseCase,
    private readonly getMyReservations: GetMyTableReservationsUseCase,
  ) {}

  @Get('pickup/slots')
  @ApiOperation({ summary: 'Get available pickup slots for a given date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'date', example: '2026-09-01' })
  availableSlots(@Query('date') date: string) {
    return this.getSlots.execute(date);
  }

  @Post('table')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Book a table reservation' })
  bookTable(@CurrentUser() user: { id: string }, @Body() dto: TableReservationDto) {
    return this.createTable.execute({
      userId: user.id,
      partySize: dto.partySize,
      scheduledAt: new Date(dto.scheduledAt),
      notes: dto.notes,
    });
  }

  @Get('table/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user table reservations' })
  myReservations(@CurrentUser() user: { id: string }) {
    return this.getMyReservations.execute(user.id);
  }
}
