import { OrderEntity, OrderStatus, OrderType } from '../entities/order.entity';
import type { DrinkBuild } from '../value-objects/drink-build';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface CreateOrderData {
  userId: string;
  type: OrderType;
  notes?: string;
  deliveryAddressId?: string;
  /** Lo que se descuenta del total. Ya calculado y comprobado. */
  discountAmount?: number;
  /** La llave del intento de pedir, para no crear dos veces el mismo. */
  idempotencyKey?: string;
  items: {
    productId: string;
    qty: number;
    unitPrice: number;
    build?: DrinkBuild;
    recipeId?: string;
    name?: string;
    ticket?: string;
    extras?: string[];
    vessel?: string;
  }[];
}

export interface IOrderRepository {
  findById(id: string): Promise<OrderEntity | null>;
  findByUser(userId: string): Promise<OrderEntity[]>;
  /** `tx` es la transacción en curso, cuando la hay. El dominio no sabe de qué tipo es. */
  create(data: CreateOrderData, tx?: unknown): Promise<OrderEntity>;
  updateStatus(id: string, status: OrderStatus, note?: string): Promise<OrderEntity>;
  /**
   * Cambia el estado solo si sigue siendo `from`.
   *
   * Devuelve null si otra persona lo cambió antes. Es la diferencia entre
   * «leer y luego escribir», que deja pasar a dos a la vez, y una escritura
   * que la base hace de una sola vez.
   */
  transition(
    id: string,
    from: OrderStatus,
    to: OrderStatus,
    note?: string,
  ): Promise<OrderEntity | null>;
}
