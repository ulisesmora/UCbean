import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface SlotAvailability {
  date: string; // YYYY-MM-DD
  slots: string[]; // HH:MM times that are open
}

// Café is open 07:00–19:00; pickup every 15 min; max 8 orders per slot
const OPEN_HOUR = 7;
const CLOSE_HOUR = 19;
const SLOT_INTERVAL_MIN = 15;
const MAX_PER_SLOT = 8;

@Injectable()
export class GetAvailableSlotsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dateStr: string): Promise<SlotAvailability> {
    const base = new Date(`${dateStr}T00:00:00`);
    const dayStart = new Date(base);
    dayStart.setHours(OPEN_HOUR, 0, 0, 0);
    const dayEnd = new Date(base);
    dayEnd.setHours(CLOSE_HOUR, 0, 0, 0);

    const booked = await this.prisma.pickupReservation.groupBy({
      by: ['slotTime'],
      _count: true,
      where: { slotTime: { gte: dayStart, lt: dayEnd } },
    });

    const countBySlot = new Map<number, number>();
    for (const b of booked) {
      countBySlot.set(b.slotTime.getTime(), b._count);
    }

    const slots: string[] = [];
    const now = new Date();
    let cursor = new Date(dayStart);

    while (cursor < dayEnd) {
      const count = countBySlot.get(cursor.getTime()) ?? 0;
      // Slot must be in the future and have capacity
      if (cursor > now && count < MAX_PER_SLOT) {
        const hh = String(cursor.getHours()).padStart(2, '0');
        const mm = String(cursor.getMinutes()).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }
      cursor = new Date(cursor.getTime() + SLOT_INTERVAL_MIN * 60_000);
    }

    return { date: dateStr, slots };
  }
}
