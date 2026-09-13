/**
 * Cómo se leen los cobros en el mostrador.
 *
 * En un solo sitio para que la caja y el detalle de un pedido digan lo mismo
 * del mismo cobro. Los estados son los de Stripe más los que añade el
 * webhook (reembolsos y disputas).
 */

export type Tone = 'olive' | 'ember' | 'neutral';

export const PAYMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  succeeded: { label: 'Collected', tone: 'olive' },
  processing: { label: 'Bank processing', tone: 'neutral' },
  requires_payment_method: { label: 'Card declined or not entered', tone: 'ember' },
  requires_action: { label: 'Waiting for 3-D Secure', tone: 'ember' },
  canceled: { label: 'Cancelled', tone: 'neutral' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  partially_refunded: { label: 'Partly refunded', tone: 'neutral' },
  disputed: { label: 'Disputed', tone: 'ember' },
};

export const paymentStatus = (s: string) =>
  PAYMENT_STATUS[s] ?? { label: s, tone: 'neutral' as Tone };

/** Apple Pay y Google Pay son una tarjeta por dentro; a la caja le importa la cartera. */
export const PAYMENT_METHOD: Record<string, string> = {
  card: 'Card',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  link: 'Link',
};

/** Los avisos de Stripe, en palabras de mostrador. */
export const STRIPE_EVENT: Record<string, string> = {
  'payment_intent.succeeded': 'Payment collected',
  'payment_intent.payment_failed': 'Payment failed',
  'payment_intent.processing': 'Bank processing',
  'payment_intent.requires_action': 'Asked for 3-D Secure',
  'payment_intent.canceled': 'Payment cancelled',
  'charge.succeeded': 'Card charged',
  'charge.refunded': 'Refunded',
  'charge.dispute.created': 'Dispute opened',
};
