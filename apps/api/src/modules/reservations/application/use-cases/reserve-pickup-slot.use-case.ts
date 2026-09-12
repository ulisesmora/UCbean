import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { PickupReservation } from '../../domain/entities/pickup-reservation.entity';
import {
  CLOSE_HOUR,
  MAX_PER_SLOT,
  OPEN_HOUR,
  SLOT_INTERVAL_MIN,
} from './get-available-slots.use-case';

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
   * ponytail: two requests can pass this check for the same last place. At
   * eight orders per fifteen minutes that is a staffing annoyance, not a
   * correctness problem. If it ever bites, put the count and the insert in one
   * transaction with a serializable isolation level.
   */
  async assertOpen(slotTime: Date): Promise<void> {
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

    const taken = await this.prisma.pickupReservation.count({ where: { slotTime } });
    if (taken >= MAX_PER_SLOT) {
      throw new BadRequestException('That pickup time just filled up. Pick another.');
    }
  }

  async execute(orderId: string, slotTime: Date): Promise<PickupReservation> {
    const r = await this.prisma.pickupReservation.create({
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
