/**
 * Qué descuenta un descuento, y cuándo se puede usar.
 *
 * Funciones puras sobre datos sencillos, aparte del módulo de Prisma,
 * porque son las reglas que más se van a tocar y las que peor se ven
 * enterradas dentro de una consulta.
 */

export type DiscountKind = 'PERCENT' | 'AMOUNT';

export interface DiscountRule {
  kind: DiscountKind;
  /** Porcentaje de 0 a 100, o dinero, según `kind`. */
  value: number;
  minOrderTotal: number | null;
  maxRedemptions: number | null;
  perUserLimit: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  /** Nulo cuando lo puede usar cualquiera. */
  userId: string | null;
}

export type Rejection =
  | 'INACTIVE'
  | 'NOT_STARTED'
  | 'EXPIRED'
  | 'NOT_YOURS'
  | 'BELOW_MINIMUM'
  | 'EXHAUSTED'
  | 'ALREADY_USED';

const MOTIVOS: Record<Rejection, string> = {
  INACTIVE: 'Ese código ya no está disponible',
  NOT_STARTED: 'Ese código todavía no empieza',
  EXPIRED: 'Ese código ya venció',
  NOT_YOURS: 'Ese código es de otra cuenta',
  BELOW_MINIMUM: 'Tu pedido no llega al mínimo de ese código',
  EXHAUSTED: 'Ese código ya se agotó',
  ALREADY_USED: 'Ya usaste ese código',
};

/** El texto que ve el cliente. Dice qué pasó, no solo que falló. */
export const reasonText = (r: Rejection) => MOTIVOS[r];

/**
 * Si este descuento se puede aplicar a este pedido.
 *
 * El orden importa para el mensaje: primero lo que no depende del
 * pedido (existe, es tuyo, está vigente) y al final lo que el cliente
 * puede arreglar añadiendo algo más a la cesta.
 */
export function checkDiscount(
  rule: DiscountRule,
  ctx: { userId: string; orderTotal: number; globalUses: number; userUses: number; now?: Date },
): Rejection | null {
  const now = ctx.now ?? new Date();

  if (!rule.isActive) return 'INACTIVE';
  if (rule.userId && rule.userId !== ctx.userId) return 'NOT_YOURS';
  if (rule.startsAt && now < rule.startsAt) return 'NOT_STARTED';
  if (rule.endsAt && now > rule.endsAt) return 'EXPIRED';
  if (rule.maxRedemptions !== null && ctx.globalUses >= rule.maxRedemptions) return 'EXHAUSTED';
  if (ctx.userUses >= rule.perUserLimit) return 'ALREADY_USED';
  if (rule.minOrderTotal !== null && ctx.orderTotal < rule.minOrderTotal) return 'BELOW_MINIMUM';

  return null;
}

/**
 * Cuánto se descuenta de verdad.
 *
 * Nunca más que el total: un descuento de 10 dólares sobre un café de
 * 4 deja el pedido en cero, no en menos cuatro, que sería devolverle
 * dinero a alguien por comprar barato.
 */
export function discountAmount(rule: DiscountRule, orderTotal: number): number {
  if (orderTotal <= 0) return 0;

  const bruto =
    rule.kind === 'PERCENT'
      ? (orderTotal * Math.min(Math.max(rule.value, 0), 100)) / 100
      : Math.max(rule.value, 0);

  return Math.round(Math.min(bruto, orderTotal) * 100) / 100;
}
