import type { DrinkBuild } from '../value-objects/drink-build';

export type OrderStatus =
  'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type OrderType = 'PICKUP' | 'DELIVERY' | 'TABLE';

export class OrderItemEntity {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly qty: number,
    public readonly unitPrice: number,
    /** How this drink was made. Null for anything not built in the configurator. */
    public readonly build: DrinkBuild | null = null,
    /** The menu recipe it came from, null when the customer built it. */
    public readonly recipeId: string | null = null,
    /**
     * What the customer saw when they ordered. Snapshotted rather than joined,
     * because a product can be renamed or repriced and an old ticket should
     * still read the way it did on the day.
     */
    public readonly name: string | null = null,
    public readonly ticket: string | null = null,
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
