import { describe, expect, it } from 'vitest';
import type { Order, OrderItem } from '@/types/api.types';
import { lineKey, rhythmFor, tierFor, usualsFrom } from './usuals';

const line = (productId: string, extra: Partial<OrderItem> = {}): OrderItem => ({
  productId,
  productName: productId,
  qty: 1,
  unitPrice: 5,
  subtotal: 5,
  ...extra,
});

const order = (
  createdAt: string,
  items: OrderItem[],
  status: Order['status'] = 'COMPLETED',
): Order => ({
  id: createdAt,
  userId: 'u',
  type: 'PICKUP',
  status,
  total: 5,
  notes: null,
  items,
  createdAt,
});

const now = new Date('2026-09-13T09:00:00');

describe('usualsFrom', () => {
  it('puts the drink ordered most at this hour first', () => {
    const usuals = usualsFrom(
      [
        order('2026-09-10T09:05:00', [line('latte')]),
        order('2026-09-11T08:40:00', [line('latte')]),
        order('2026-09-12T09:20:00', [line('latte'), line('cookie')]),
        order('2026-09-12T15:00:00', [line('cortado', { qty: 3 })]),
      ],
      now,
    );
    expect(usuals[0].item.productId).toBe('latte');
    expect(usuals[0].times).toBe(3);
    expect(usuals[0].atThisHour).toBe(true);
    expect(usuals.find((u) => u.item.productId === 'cortado')?.atThisHour).toBe(false);
  });

  it('ignores cancelled orders', () => {
    const usuals = usualsFrom([order('2026-09-12T09:00:00', [line('mocha')], 'CANCELLED')], now);
    expect(usuals).toHaveLength(0);
  });

  it('tells the same drink with different extras apart', () => {
    expect(lineKey(line('latte'))).not.toBe(lineKey(line('latte', { extras: ['oat'] })));
    expect(lineKey(line('latte', { extras: ['oat', 'shot'] }))).toBe(
      lineKey(line('latte', { extras: ['shot', 'oat'] })),
    );
  });

  it('keeps the newest version of a line to repeat', () => {
    const usuals = usualsFrom(
      [
        order('2026-09-12T09:00:00', [line('latte', { name: 'new' })]),
        order('2026-09-01T09:00:00', [line('latte', { name: 'old' })]),
      ],
      now,
    );
    expect(usuals[0].item.name).toBe('new');
    expect(usuals[0].orders).toBe(2);
  });
});

describe('tierFor', () => {
  const visits = (n: number, status: Order['status'] = 'COMPLETED') =>
    Array.from({ length: n }, (_, i) =>
      order(`2026-09-01T09:${String(i).padStart(2, '0')}:00`, [line('x')], status),
    );

  it('starts everyone as a new face', () => {
    expect(tierFor([]).tier.id).toBe('new');
  });

  it('counts only visits that happened', () => {
    const r = tierFor([...visits(3), ...visits(5, 'PENDING'), ...visits(5, 'CANCELLED')]);
    expect(r.tier.id).toBe('regular');
    expect(r.toNext).toBe(7);
    expect(r.next?.id).toBe('local');
  });

  it('has nothing above family', () => {
    const r = tierFor(visits(30));
    expect(r.tier.id).toBe('family');
    expect(r.next).toBeNull();
    expect(r.progress).toBe(1);
  });
});

describe('rhythmFor', () => {
  it('needs three visits before naming a pattern', () => {
    expect(rhythmFor([order('2026-09-01T08:00:00', [line('x')])])).toBeNull();
  });

  it('spots the early bird', () => {
    const mornings = ['01', '02', '03'].map((d) => order(`2026-09-${d}T08:00:00`, [line('x')]));
    expect(rhythmFor(mornings)).toBe('Early bird');
  });
});
