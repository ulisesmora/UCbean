import type { Order, OrderItem } from '@/types/api.types';

/**
 * What someone usually orders, read straight from their own history.
 *
 * There is no separate taste profile stored anywhere. The order history already
 * is the record of what a person drinks, and a second copy would only drift
 * from it. This runs in the browser over the orders the account page already
 * downloads, so stopping by at a new time of day changes it on its own.
 */

/** A drink on repeat: its most recent line and how much it weighs. */
export interface Usual {
  key: string;
  /** The newest line for this drink. It is what goes back into the bag. */
  item: OrderItem;
  /** Cups in total. */
  times: number;
  /** Separate orders it appeared in. */
  orders: number;
  lastAt: string;
  /** Ordered at least twice within two hours of the current time. */
  atThisHour: boolean;
  score: number;
}

const DAY = 86_400_000;
/** Last month's coffee counts half as much as this week's. */
const HALF_LIFE_DAYS = 30;

/** Orders that count as a visit: not cancelled, and not left unpaid. */
export function visitsOf(orders: Order[]): Order[] {
  return orders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'PENDING');
}

/** Same drink means same product, same recipe, same formula and same extras. */
export function lineKey(i: OrderItem): string {
  return [
    i.productId,
    i.recipeId ?? '',
    i.build ? JSON.stringify(i.build) : '',
    [...(i.extras ?? [])].sort().join('+'),
  ].join('|');
}

/** Hours between two times of day, across midnight too. */
function hoursApart(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 24 - d);
}

/**
 * Usuals, best first.
 *
 * Frequency with a recency decay, plus a boost for what gets ordered around
 * this hour: the 9am flat white and the 3pm iced latte are both usuals, just
 * not at the same time. Anything that is a habit at this hour goes first.
 */
export function usualsFrom(orders: Order[], now = new Date()): Usual[] {
  const byKey = new Map<string, Usual & { hourHits: number }>();
  const hour = now.getHours();

  for (const o of orders) {
    if (o.status === 'CANCELLED') continue;
    const when = new Date(o.createdAt);
    const ageDays = Math.max(0, (now.getTime() - when.getTime()) / DAY);
    const weight = 0.5 ** (ageDays / HALF_LIFE_DAYS);
    const near = hoursApart(when.getHours(), hour) <= 2;
    const seen = new Set<string>();

    for (const i of o.items) {
      const key = lineKey(i);
      const u = byKey.get(key) ?? {
        key,
        item: i,
        times: 0,
        orders: 0,
        lastAt: o.createdAt,
        atThisHour: false,
        score: 0,
        hourHits: 0,
      };
      u.times += i.qty;
      u.score += i.qty * weight * (near ? 1.5 : 1);
      if (!seen.has(key)) {
        seen.add(key);
        u.orders += 1;
        if (near) u.hourHits += 1;
      }
      if (when.getTime() >= new Date(u.lastAt).getTime()) {
        u.item = i;
        u.lastAt = o.createdAt;
      }
      byKey.set(key, u);
    }
  }

  return [...byKey.values()]
    .map(({ hourHits, ...u }) => ({ ...u, atThisHour: hourHits >= 2 }))
    .sort((a, b) => Number(b.atThisHour) - Number(a.atThisHour) || b.score - a.score);
}

export interface Tier {
  id: 'new' | 'regular' | 'local' | 'family';
  name: string;
  blurb: string;
  /** Visits needed to reach it. */
  min: number;
}

/**
 * What kind of customer someone is, by how often they come back.
 *
 * Recognition, not a discount ladder: no tier promises a perk the café does
 * not actually give. If one ever does, it belongs in the blurb.
 */
export const TIERS: Tier[] = [
  { id: 'new', name: 'New face', min: 0, blurb: 'Welcome in. Every order earns points.' },
  { id: 'regular', name: 'Regular', min: 3, blurb: 'The bar is starting to know your order.' },
  { id: 'local', name: 'Local', min: 10, blurb: 'Part of the crowd at the counter.' },
  { id: 'family', name: 'Family', min: 30, blurb: 'One of ours. Thanks for coming back.' },
];

export function tierFor(orders: Order[]) {
  const visits = visitsOf(orders).length;
  let i = 0;
  while (i + 1 < TIERS.length && visits >= TIERS[i + 1].min) i++;
  const tier = TIERS[i];
  const next = TIERS[i + 1] ?? null;
  return {
    tier,
    next,
    visits,
    toNext: next ? next.min - visits : 0,
    progress: next ? (visits - tier.min) / (next.min - tier.min) : 1,
  };
}

/** When someone tends to come in, once there are enough visits to say so. */
export function rhythmFor(orders: Order[]): string | null {
  const visits = visitsOf(orders);
  if (visits.length < 3) return null;

  const slots: Record<string, number> = {
    'Early bird': 0,
    'Lunch-hour regular': 0,
    'Afternoon pick-me-up': 0,
    'Night owl': 0,
  };
  for (const o of visits) {
    const h = new Date(o.createdAt).getHours();
    if (h < 11) slots['Early bird']++;
    else if (h < 14) slots['Lunch-hour regular']++;
    else if (h < 17) slots['Afternoon pick-me-up']++;
    else slots['Night owl']++;
  }
  const [name, count] = Object.entries(slots).sort((a, b) => b[1] - a[1])[0];
  // Half or more at one time of day is a pattern. Less is just a schedule.
  return count / visits.length >= 0.5 ? name : null;
}
