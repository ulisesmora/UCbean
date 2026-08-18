import { Inject, Injectable } from '@nestjs/common';
import {
  ITableReservationRepository,
  TABLE_RESERVATION_REPOSITORY,
} from '../../domain/repositories/table-reservation.repository.interface';
import { TableReservation } from '../../domain/entities/table-reservation.entity';

@Injectable()
export class GetMyTableReservationsUseCase {
  constructor(
    @Inject(TABLE_RESERVATION_REPOSITORY)
    private readonly reservations: ITableReservationRepository,
  ) {}

  execute(userId: string): Promise<TableReservation[]> {
    return this.reservations.findByUser(userId);
  }
}
