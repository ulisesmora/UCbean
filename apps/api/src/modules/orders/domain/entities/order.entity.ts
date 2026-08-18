export type OrderStatus =
  'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type OrderType = 'PICKUP' | 'DELIVERY' | 'TABLE';

export class OrderItemEntity {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly qty: number,
    public readonly unitPrice: number,
  ) {}

  get subtotal(): number {
    return this.qty * this.unitPrice;
  }
}

export class OrderEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: OrderType,
    public readonly status: OrderStatus,
    public readonly total: number,
    public readonly items: OrderItemEntity[],
    public readonly notes: string | null,
    public readonly deliveryAddressId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  // Guard: valid status transitions
  static allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  canTransitionTo(next: OrderStatus): boolean {
    return OrderEntity.allowedTransitions[this.status].includes(next);
  }
}
