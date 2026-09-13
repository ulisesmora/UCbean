import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Comprueba que un webhook viene de Stripe de verdad.
 *
 * La ruta del webhook es pública: tiene que serlo, porque Stripe la
 * llama desde fuera sin ningún token. Lo único que separa un aviso real
 * de alguien mandando «este pedido ya está pagado» es esta firma.
 *
 * Stripe manda una cabecera así:
 *
 *     Stripe-Signature: t=1789175520,v1=5257a869e7...,v1=otra
 *
 * y la firma es HMAC-SHA256 de `${t}.${cuerpo_sin_tocar}` con el secreto
 * del endpoint. El cuerpo tiene que ser exactamente los bytes recibidos:
 * si se parsea a JSON y se vuelve a serializar, cambia un espacio y la
 * firma deja de cuadrar.
 *
 * Función pura para poder probarla sin red ni base de datos.
 */

export type SignatureFailure =
  'MALFORMED_HEADER' | 'NO_SIGNATURES' | 'TIMESTAMP_TOO_OLD' | 'MISMATCH';

/** Cuánto se acepta de desfase entre el reloj de Stripe y el nuestro. */
export const TOLERANCE_SECONDS = 300;

export interface ParsedSignature {
  timestamp: number;
  signatures: string[];
}

/**
 * Parte la cabecera en marca de tiempo y firmas.
 *
 * Puede venir más de una `v1` cuando el secreto se está rotando: durante
 * la rotación Stripe firma con los dos, y aceptar cualquiera es lo que
 * permite cambiar el secreto sin perder avisos.
 */
export function parseSignatureHeader(header: string): ParsedSignature | null {
  if (!header || typeof header !== 'string') return null;

  let timestamp = Number.NaN;
  const signatures: string[] = [];

  for (const part of header.split(',')) {
    const [clave, valor] = part.trim().split('=', 2);
    if (clave === 't') timestamp = Number(valor);
    else if (clave === 'v1' && valor) signatures.push(valor);
  }

  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  return { timestamp, signatures };
}

/**
 * Compara dos firmas en hexadecimal sin filtrar dónde difieren.
 *
 * `timingSafeEqual` tarda lo mismo acierte o no. Una comparación normal
 * se corta en el primer byte distinto, y ese tiempo, medido muchas veces,
 * deja adivinar la firma carácter a carácter.
 */
function equalSignature(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    // Buffer.from con hex inválido no lanza, pero devuelve algo más corto
    // y entonces timingSafeEqual sí lanza. Eso es una firma inválida.
    return false;
  }
}

/**
 * Devuelve null si la firma es buena, o el motivo del rechazo.
 *
 * `rawBody` tienen que ser los bytes tal cual llegaron.
 */
export function verifyStripeSignature(
  rawBody: string,
  header: string,
  secret: string,
  now: number = Math.floor(Date.now() / 1000),
): SignatureFailure | null {
  const parsed = parseSignatureHeader(header);
  if (!parsed) return 'MALFORMED_HEADER';
  if (parsed.signatures.length === 0) return 'NO_SIGNATURES';

  // Sin esta ventana, alguien que capture un aviso válido podría
  // reenviarlo mañana y volvería a colar.
  if (Math.abs(now - parsed.timestamp) > TOLERANCE_SECONDS) return 'TIMESTAMP_TOO_OLD';

  const esperada = createHmac('sha256', secret)
    .update(`${parsed.timestamp}.${rawBody}`, 'utf8')
    .digest('hex');

  return parsed.signatures.some((s) => equalSignature(s, esperada)) ? null : 'MISMATCH';
}

/** Firma un cuerpo igual que lo haría Stripe. Solo para las pruebas. */
export function signPayload(rawBody: string, secret: string, timestamp: number): string {
  const firma = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');
  return `t=${timestamp},v1=${firma}`;
}
