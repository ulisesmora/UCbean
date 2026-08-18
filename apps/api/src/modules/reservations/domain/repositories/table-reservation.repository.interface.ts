import { TableReservation, ReservationStatus } from '../entities/table-reservation.entity';

export const TABLE_RESERVATION_REPOSITORY = Symbol('TABLE_RESERVATION_REPOSITORY');

export interface ITableReservationRepository {
  findByUser(userId: string): Promise<TableReservation[]>;
  findById(id: string): Promise<TableReservation | null>;
  findByDateRange(from: Date, to: Date): Promise<TableReservation[]>;
  create(data: {
    userId: string;
    tableId: string;
    partySize: number;
    scheduledAt: Date;
    notes?: string;
  }): Promise<TableReservation>;
  updateStatus(id: string, status: ReservationStatus): Promise<TableReservation>;
}
