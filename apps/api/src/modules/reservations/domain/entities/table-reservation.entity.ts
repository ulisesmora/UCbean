export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED';

export class TableReservation {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tableId: string,
    public readonly partySize: number,
    public readonly scheduledAt: Date,
    public readonly status: ReservationStatus,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
