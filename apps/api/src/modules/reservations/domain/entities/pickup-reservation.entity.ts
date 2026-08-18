export class PickupReservation {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly slotTime: Date,
    public readonly confirmationCode: string,
    public readonly createdAt: Date,
  ) {}
}
