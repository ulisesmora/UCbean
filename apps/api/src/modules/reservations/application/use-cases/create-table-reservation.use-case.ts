import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import {
  ITableReservationRepository,
  TABLE_RESERVATION_REPOSITORY,
} from '../../domain/repositories/table-reservation.repository.interface';
import {
  ITableRepository,
  TABLE_REPOSITORY,
} from '../../domain/repositories/table.repository.interface';
import { TableReservation } from '../../domain/entities/table-reservation.entity';

@Injectable()
export class CreateTableReservationUseCase {
  constructor(
    @Inject(TABLE_RESERVATION_REPOSITORY)
    private readonly reservations: ITableReservationRepository,
    @Inject(TABLE_REPOSITORY)
    private readonly tables: ITableRepository,
  ) {}

  async execute(data: {
    userId: string;
    partySize: number;
    scheduledAt: Date;
    notes?: string;
  }): Promise<TableReservation> {
    // Find reservations within ±90 min to determine occupied tables
    const nearby = await this.reservations.findByDateRange(
      new Date(data.scheduledAt.getTime() - 90 * 60_000),
      new Date(data.scheduledAt.getTime() + 90 * 60_000),
    );
    const occupiedIds = nearby.map((r) => r.tableId);

    const table = await this.tables.findAvailable(data.partySize, occupiedIds);
    if (!table) {
      throw new BadRequestException('No tables available for that time and party size');
    }

    return this.reservations.create({ ...data, tableId: table.id });
  }
}
