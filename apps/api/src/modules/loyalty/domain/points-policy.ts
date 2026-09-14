/**
 * Cuántos puntos da un pedido, y qué cuesta canjearlos.
 *
 * Aparte en su propio archivo porque son las reglas que el dueño va a
 * querer mover, y moverlas no debería obligar a leer un caso de uso.
 * Funciones puras, así que se prueban sin base de datos.
 */

/** Un punto por cada dólar completo. Un café de 5.75 da 5. */
export const POINTS_PER_DOLLAR = 1;

/** Lo que se regala al crear la cuenta. */
export const SIGNUP_POINTS = 50;

/** Lo que se regala el día del cumpleaños. */
export const BIRTHDAY_POINTS = 100;

/** Once per person, the first time they open the app from the home screen. */
export const APP_INSTALL_POINTS = 50;

/** Un sello por pedido, como la tarjeta de cartón de toda la vida. */
export const STAMPS_PER_ORDER = 1;

/**
 * Puntos que deja un pedido.
 *
 * Se redondea hacia abajo: prometer un punto por dólar y dar 5.75 por
 * un café de 5.75 confunde a todo el mundo. Un total negativo o cero
 * no da nada, que es lo que pasa con un pedido totalmente descontado.
 */
export function pointsForOrder(total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.floor(total) * POINTS_PER_DOLLAR;
}

/**
 * Si alcanza para canjear.
 *
 * El saldo se suma del libro de movimientos, así que puede quedar en
 * negativo si algo se descuadra. Comparar con `>=` sobre un número que
 * podría ser negativo es correcto y no hace falta nada más.
 */
export function canAfford(balance: number, cost: number): boolean {
  return cost > 0 && balance >= cost;
}
