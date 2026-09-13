import { CafeController } from './cafe.controller';
import { MAX_PER_SLOT } from '../reservations/application/use-cases/get-available-slots.use-case';
import type { PrismaService } from '../../prisma/prisma.service';

/** Un local con `enCola` pedidos por delante. */
function local(enCola: number) {
  const prisma = {
    order: { count: () => Promise.resolve(enCola) },
    tableReservation: { count: () => Promise.resolve(0) },
    table: { count: () => Promise.resolve(12) },
  } as unknown as PrismaService;
  return new CafeController(prisma);
}

/** Coloca el reloj en una hora de hoy, abierto o cerrado. */
function reloj(hora: number) {
  const d = new Date();
  d.setHours(hora, 0, 0, 0);
  jest.useFakeTimers().setSystemTime(d);
}

describe('El pulso del local', () => {
  afterEach(() => jest.useRealTimers());

  it('sin cola dice que está tranquilo', async () => {
    reloj(10);
    expect((await local(0).pulse()).pulse).toBe('quiet');
  });

  it('con la barra a tope dice que está lleno', async () => {
    reloj(10);
    expect((await local(MAX_PER_SLOT).pulse()).pulse).toBe('busy');
  });

  it('en medio dice que hay algunos por delante', async () => {
    reloj(10);
    expect((await local(Math.ceil(MAX_PER_SLOT / 3)).pulse()).pulse).toBe('steady');
  });

  it('cerrado no promete espera ninguna', async () => {
    // Una espera de cinco minutos a las cinco de la mañana haría que alguien
    // se plantara en la puerta de un local cerrado.
    reloj(5);
    const r = await local(3).pulse();
    expect(r.open).toBe(false);
    expect(r.waitMinutes).toBeNull();
  });

  it('nunca promete menos de cinco minutos', async () => {
    reloj(10);
    expect((await local(1).pulse()).waitMinutes).toBeGreaterThanOrEqual(5);
  });
});
