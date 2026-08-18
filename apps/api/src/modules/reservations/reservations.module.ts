import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TABLE_RESERVATION_REPOSITORY } from './domain/repositories/table-reservation.repository.interface';
import { TABLE_REPOSITORY } from './domain/repositories/table.repository.interface';
import { PrismaTableReservationRepository } from './infrastructure/repositories/prisma-table-reservation.repository';
import { PrismaTableRepository } from './infrastructure/repositories/prisma-table.repository';
import { GetAvailableSlotsUseCase } from './application/use-cases/get-available-slots.use-case';
import { CreateTableReservationUseCase } from './application/use-cases/create-table-reservation.use-case';
import { GetMyTableReservationsUseCase } from './application/use-cases/get-my-table-reservations.use-case';
import { ReservationsController } from './presentation/controllers/reservations.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ReservationsController],
  providers: [
    { provide: TABLE_RESERVATION_REPOSITORY, useClass: PrismaTableReservationRepository },
    { provide: TABLE_REPOSITORY, useClass: PrismaTableRepository },
    GetAvailableSlotsUseCase,
    CreateTableReservationUseCase,
    GetMyTableReservationsUseCase,
  ],
})
export class ReservationsModule {}
