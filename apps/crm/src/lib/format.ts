/**
 * Cómo se escriben las cosas en pantalla.
 *
 * En un solo sitio para que el precio de la cola y el del corte de caja
 * no se vean distintos.
 */

export const money = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n ?? 0);

export const time = (d: string | Date) =>
  new Date(d).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false });

export const dayMonth = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-CA', { day: 'numeric', month: 'short' });

/**
 * Cuánto lleva esperando un pedido.
 *
 * En minutos y no en «hace 2 horas»: la barra necesita saber si algo
 * lleva veinte minutos parado, y una frase redondeada esconde justo eso.
 */
export function minutesAgo(d: string | Date): number {
  return Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60_000));
}

export const ORDER_STATUS: Record<string, { label: string; next?: string }> = {
  PENDING: { label: 'Unconfirmed', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Confirmed', next: 'PREPARING' },
  PREPARING: { label: 'Preparing', next: 'READY' },
  READY: { label: 'Ready at the bar', next: 'COMPLETED' },
  COMPLETED: { label: 'Handed over' },
  CANCELLED: { label: 'Cancelled' },
};

export const RESERVATION_STATUS: Record<string, string> = {
  PENDING: 'Unconfirmed',
  CONFIRMED: 'Confirmed',
  SEATED: 'Seated',
  COMPLETED: 'Finished',
  CANCELLED: 'Cancelled',
};

export const ORDER_TYPE: Record<string, string> = {
  PICKUP: 'Pickup',
  DELIVERY: 'Delivery',
  TABLE: 'At a table',
};
