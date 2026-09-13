import type { Tx } from '../../../../prisma/transaction';
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { PickupReservation } from '../../domain/entities/pickup-reservation.entity';
import {
  CLOSE_HOUR,
  MAX_PER_SLOT,
  OPEN_HOUR,
  SLOT_INTERVAL_MIN,
} from './get-available-slots.use-case';

/** Lo que tarda la barra en sacar un pedido. */
export const PREP_MINUTES = 10;

/**
 * Holds a pickup slot for an order.
 *
 * The order is what the customer pays for; this is the promise about when it
 * will be on the counter. The two are created together, so a paid order can
 * never end up without a time.
 *
 * Capacity is re-checked here rather than trusted from the slot listing the
 * customer saw. Between opening the picker and pressing order, someone else
 * can take the last place in that fifteen minutes.
 */
@Injectable()
export class ReservePickupSlotUseCase {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks a slot is real, future and not full, without booking it.
   *
   * Called before the order row is written, so a rejected time fails the whole
   * request instead of leaving an order nobody scheduled.
   *
   * Llamado con `tx`, forma parte de la transacción serializable del pedido,
   * así que dos peticiones no pueden quedarse con la misma última plaza.
   */
  /** La reserva de un pedido: a qué hora y con qué código. */
  async forOrder(orderId: string) {
    return this.prisma.pickupReservation.findUnique({ where: { orderId } });
  }

  /**
   * El primer hueco al que de verdad llega la barra.
   *
   * «Ahora mismo» no puede ser la hora actual: un café tarda en hacerse y
   * el hueco tiene que caer en la rejilla de quince minutos. Esto redondea
   * hacia arriba desde ahora más el tiempo de preparación, y si ese hueco
   * está lleno prueba el siguiente.
   *
   * Devuelve null cuando ya no queda nada hoy, que es lo que la web
   * necesita saber para decirlo en vez de fallar al confirmar.
   */
  async nextOpenSlot(): Promise<Date | null> {
    const desde = new Date(Date.now() + PREP_MINUTES * 60_000);

    // Al siguiente múltiplo de quince, nunca hacia atrás.
    desde.setSeconds(0, 0);
    const resto = desde.getMinutes() % SLOT_INTERVAL_MIN;
    if (resto !== 0) desde.setMinutes(desde.getMinutes() + (SLOT_INTERVAL_MIN - resto));

    const cierre = new Date(desde);
    cierre.setHours(CLOSE_HOUR, 0, 0, 0);

    for (
      let t = new Date(desde);
      t < cierre;
      t = new Date(t.getTime() + SLOT_INTERVAL_MIN * 60_000)
    ) {
      if (t.getHours() < OPEN_HOUR) continue;
      const taken = await this.prisma.pickupReservation.count({ where: { slotTime: t } });
      if (taken < MAX_PER_SLOT) return t;
    }

    return null;
  }

  async assertOpen(slotTime: Date, tx?: Tx): Promise<void> {
    if (Number.isNaN(slotTime.getTime())) {
      throw new BadRequestException('Pickup time is not a valid date');
    }
    if (slotTime.getMinutes() % SLOT_INTERVAL_MIN !== 0 || slotTime.getSeconds() !== 0) {
      throw new BadRequestException(`Pickup times run every ${SLOT_INTERVAL_MIN} minutes`);
    }
    if (slotTime.getHours() < OPEN_HOUR || slotTime.getHours() >= CLOSE_HOUR) {
      throw new BadRequestException(`We are open ${OPEN_HOUR}:00 to ${CLOSE_HOUR}:00`);
    }
    if (slotTime.getTime() <= Date.now()) {
      throw new BadRequestException('That pickup time has already passed');
    }

    // Con `tx` este conteo forma parte de la transacción serializable del
    // pedido: si otro pedido llena la última plaza a la vez, Postgres aborta
    // uno de los dos y el reintento ya ve el hueco lleno.
    const taken = await (tx ?? this.prisma).pickupReservation.count({ where: { slotTime } });
    if (taken >= MAX_PER_SLOT) {
      throw new BadRequestException('That pickup time just filled up. Pick another.');
    }
  }

  async execute(orderId: string, slotTime: Date, tx?: Tx): Promise<PickupReservation> {
    const r = await (tx ?? this.prisma).pickupReservation.create({
      data: { orderId, slotTime, confirmationCode: makeCode() },
    });
    return new PickupReservation(r.id, r.orderId, r.slotTime, r.confirmationCode, r.createdAt);
  }
}

/**
 * The code the customer reads out at the counter.
 *
 * Six characters from an alphabet with no O/0 or I/1, because it gets spoken
 * across a loud room. Collisions are caught by the unique index, and at eight
 * orders a slot the odds never get interesting.
 */
function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
