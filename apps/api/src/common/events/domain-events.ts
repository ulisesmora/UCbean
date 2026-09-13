/**
 * Lo que pasa en la cafetería, dicho una sola vez.
 *
 * Un pedido no sabe nada de puntos, ni de correos, ni de campañas.
 * Anuncia que ocurrió y quien tenga algo que hacer reacciona. Así
 * lealtad, avisos y descuentos se enchufan sin que el módulo de
 * pedidos crezca cada vez que se añade una regla de negocio.
 *
 * `@nestjs/event-emitter` ya estaba instalado y registrado en
 * AppModule sin usarse. Esto es lo que le da trabajo.
 *
 * Los eventos se emiten después de escribir en la base, nunca antes:
 * un oyente que regala puntos por un pedido que falló es peor que
 * no tener puntos.
 */

export const EVENTS = {
  userRegistered: 'user.registered',
  emailVerified: 'user.email-verified',
  orderPlaced: 'order.placed',
  orderStatusChanged: 'order.status-changed',
  tableReservationPlaced: 'reservation.table-placed',
  paymentFailed: 'payment.failed',
  paymentRefunded: 'payment.refunded',
} as const;

export interface UserRegisteredEvent {
  userId: string;
  email: string;
  name: string;
}

export interface EmailVerifiedEvent {
  userId: string;
  email: string;
  name: string;
}

export interface OrderPlacedEvent {
  orderId: string;
  userId: string;
  total: number;
  /** Lo que se está preparando, para el cuerpo del aviso. */
  lines: string[];
  /** Hora de recogida y código, cuando el pedido es para llevar. */
  slotTime?: Date;
  confirmationCode?: string;
}

export interface OrderStatusChangedEvent {
  orderId: string;
  userId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  total: number;
}

export interface TableReservationPlacedEvent {
  reservationId: string;
  userId: string;
  partySize: number;
  scheduledAt: Date;
}

/** Un intento de pago no salió. El pedido sigue en pie. */
export interface PaymentFailedEvent {
  orderId: string;
  userId: string;
  /** El motivo que da Stripe, legible para la persona. */
  reason: string | null;
}

/** Stripe devolvió dinero de un pedido, entero o en parte. */
export interface PaymentRefundedEvent {
  orderId: string;
  userId: string;
  amount: number;
  full: boolean;
}
