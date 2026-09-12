/**
 * A quién le llega una campaña.
 *
 * Cuatro públicos, no veinte. Cada uno responde a algo que la cafetería
 * de verdad quiere hacer: escribir a todos, picar a quien ya junta
 * puntos, felicitar a los del mes, y recuperar a quien dejó de venir.
 *
 * El filtro se devuelve como datos, no como consulta ya construida, para
 * poder comprobarlo en una prueba sin base de datos: equivocarse aquí
 * significa mandar un correo a mil personas que no tocaba.
 */

export type Audience = 'ALL' | 'WITH_POINTS' | 'BIRTHDAY_MONTH' | 'INACTIVE';

/** Cuánto silencio hace falta para considerar que alguien se fue. */
export const INACTIVE_DAYS = 60;

export interface AudienceFilter {
  /** Sin pedidos desde esta fecha. */
  noOrdersSince?: Date;
  /** Mes de cumpleaños, de 1 a 12. */
  birthdayMonth?: number;
  /** Solo quien tenga saldo por encima de cero. */
  hasPoints?: boolean;
}

export function audienceFilter(audience: Audience, now = new Date()): AudienceFilter {
  switch (audience) {
    case 'WITH_POINTS':
      return { hasPoints: true };
    case 'BIRTHDAY_MONTH':
      return { birthdayMonth: now.getMonth() + 1 };
    case 'INACTIVE':
      return { noOrdersSince: new Date(now.getTime() - INACTIVE_DAYS * 24 * 3600_000) };
    case 'ALL':
    default:
      return {};
  }
}

/**
 * Si una campaña se puede mandar ya.
 *
 * Una que ya salió no se vuelve a mandar: el error más caro de este
 * módulo es el segundo envío a la misma lista, y el estado es lo único
 * que lo impide.
 */
export function canSend(
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED',
  scheduledAt: Date | null,
  now = new Date(),
): boolean {
  if (status === 'SENT' || status === 'SENDING') return false;
  if (status === 'SCHEDULED') return scheduledAt !== null && scheduledAt <= now;
  return status === 'DRAFT' || status === 'FAILED';
}
