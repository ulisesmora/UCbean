import { ReservePickupSlotUseCase, PREP_MINUTES } from './reserve-pickup-slot.use-case';
import { CLOSE_HOUR, MAX_PER_SLOT, SLOT_INTERVAL_MIN } from './get-available-slots.use-case';
import type { PrismaService } from '../../../../prisma/prisma.service';

/**
 * Una barra falsa: dice cuantas reservas hay en cada hueco.
 *
 * `llenos` son las horas del dia (formato "HH:MM" local) que ya estan a
 * tope. Todo lo demas esta vacio.
 */
function barra(llenos: string[] = []) {
  const prisma = {
    pickupReservation: {
      count: ({ where }: { where: { slotTime: Date } }) => {
        const t = where.slotTime;
        const clave = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
        return Promise.resolve(llenos.includes(clave) ? MAX_PER_SLOT : 0);
      },
    },
  } as unknown as PrismaService;
  return new ReservePickupSlotUseCase(prisma);
}

/** Coloca el reloj en una hora concreta de hoy. */
function reloj(hora: number, minuto: number) {
  const d = new Date();
  d.setHours(hora, minuto, 0, 0);
  jest.useFakeTimers().setSystemTime(d);
  return d;
}

describe('nextOpenSlot — el "ahora mismo"', () => {
  afterEach(() => jest.useRealTimers());

  it('no da la hora actual: deja tiempo para hacer el café', async () => {
    reloj(10, 0);
    const slot = await barra().nextOpenSlot();
    expect(slot).not.toBeNull();
    expect(slot!.getTime()).toBeGreaterThanOrEqual(Date.now() + PREP_MINUTES * 60_000);
  });

  it('cae siempre en la rejilla de quince minutos', async () => {
    reloj(10, 7);
    const slot = await barra().nextOpenSlot();
    expect(slot!.getMinutes() % SLOT_INTERVAL_MIN).toBe(0);
    expect(slot!.getSeconds()).toBe(0);
  });

  it('salta el hueco lleno y ofrece el siguiente', async () => {
    reloj(10, 0);
    // 10:00 + 10 min de preparacion → redondea a 10:15, que esta lleno.
    const slot = await barra(['10:15']).nextOpenSlot();
    expect(`${slot!.getHours()}:${slot!.getMinutes()}`).toBe('10:30');
  });

  it('devuelve null cuando ya no queda nada hoy', async () => {
    reloj(CLOSE_HOUR, 0);
    expect(await barra().nextOpenSlot()).toBeNull();
  });
});
