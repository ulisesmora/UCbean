import { Prisma, PrismaClient } from '@prisma/client';

/** Lo que recibe una función que corre dentro de una transacción. */
export type Tx = Prisma.TransactionClient;

/** Cuántas veces se reintenta una transacción que chocó con otra. */
const INTENTOS = 3;

/**
 * Corre `fn` en una transacción SERIALIZABLE y la reintenta si choca.
 *
 * Por qué serializable y no el nivel por omisión (READ COMMITTED):
 * las reglas que protegemos aquí son de la forma «cuenta y luego escribe»
 * —quedan plazas en ese hueco, quedan usos de ese cupón—. Con READ
 * COMMITTED dos peticiones cuentan a la vez, las dos ven sitio y las dos
 * escriben: el hueco de ocho acaba con nueve y el cupón de un uso se
 * gasta dos veces. SERIALIZABLE hace que Postgres detecte ese cruce y
 * aborte una de las dos.
 *
 * Abortar es lo correcto, pero no es un error para quien pide: la
 * transacción perdedora se vuelve a intentar desde cero, ya viendo lo que
 * escribió la ganadora. Si en el reintento ya no hay sitio, entonces sí
 * falla, con el mensaje de negocio de siempre.
 *
 * ponytail: tres intentos sin espera entre medias. Para el volumen de una
 * barra sobra; si algún día hay contención de verdad, se añade un retardo
 * aleatorio pequeño entre intentos.
 */
export async function serializable<T>(
  prisma: PrismaClient,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  let ultimo: unknown;
  for (let i = 0; i < INTENTOS; i++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 15_000,
      });
    } catch (e) {
      if (!esChoque(e)) throw e;
      ultimo = e;
    }
  }
  throw ultimo;
}

/**
 * Si el fallo es un choque entre transacciones y merece otro intento.
 *
 * P2034 es como Prisma llama al error 40001 de Postgres
 * (serialization_failure) y a los interbloqueos.
 */
function esChoque(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034';
}

/** Si un fallo es una violación de un índice único. */
export function esDuplicado(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
}
