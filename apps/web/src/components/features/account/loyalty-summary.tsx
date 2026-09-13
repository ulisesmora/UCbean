'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Gift } from 'lucide-react';
import { loyaltyApi, ordersApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { rhythmFor, tierFor } from '@/lib/usuals';
import { cn } from '@/lib/utils';

/**
 * Who you are to the café, on one card.
 *
 * The tier comes from how often you come back, the points from your balance,
 * and the next reward from the real reward list. What is left is said in
 * small concrete numbers ("4 orders to Local", "35 points to a cookie"),
 * which pull harder than a bare percentage.
 */
export function LoyaltySummary({
  className,
  showPoints = true,
}: {
  className?: string;
  /** The rewards page already prints the balance large. */
  showPoints?: boolean;
}) {
  const { isAuthenticated, accessToken } = useAuthStore();
  const enabled = isAuthenticated && !!accessToken;
  const orders = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.myOrders(accessToken!),
    enabled,
  });
  const card = useQuery({
    queryKey: ['loyalty-me'],
    queryFn: () => loyaltyApi.me(accessToken!),
    enabled,
  });
  const rewards = useQuery({ queryKey: ['rewards'], queryFn: () => loyaltyApi.rewards() });

  if (!isAuthenticated) return null;
  if (orders.isLoading || card.isLoading) {
    return (
      <div aria-hidden="true" className={cn('glass glass-edge h-48 animate-pulse', className)} />
    );
  }

  const history = orders.data ?? [];
  const { tier, next, visits, toNext, progress } = tierFor(history);
  const rhythm = rhythmFor(history);
  const points = card.data?.points ?? 0;
  const ready = card.data?.pendingRedemptions.length ?? 0;
  const active = (rewards.data ?? []).filter((r) => r.isActive).sort((a, b) => a.cost - b.cost);
  const affordable = active.filter((r) => r.cost <= points);
  const best = affordable[affordable.length - 1];
  const upcoming = active.find((r) => r.cost > points);

  return (
    <section aria-label="Your membership" className={cn('glass glass-edge p-5 md:p-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone2-400">You are a</p>
          <p className="font-seal text-[28px] leading-tight text-stone2-900">{tier.name}</p>
          <p className="mt-1 text-[14px] text-stone2-600">{tier.blurb}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Tag>
              {visits} {visits === 1 ? 'visit' : 'visits'}
            </Tag>
            {rhythm && <Tag>{rhythm}</Tag>}
          </div>
        </div>

        {showPoints && (
          <Link
            href="/rewards"
            className="tap-target shrink-0 rounded-lg border-2 border-stone2-900 bg-neon-500 px-4 py-3 text-right shadow-[3px_3px_0_#0A0A0A] transition-transform hover:-translate-y-0.5"
          >
            <span className="block font-mono text-[28px] font-bold leading-none tabular-nums text-stone2-900">
              {points}
            </span>
            <span className="text-[11px] uppercase tracking-[0.16em] text-stone2-900/70">
              points
            </span>
          </Link>
        )}
      </div>

      {next && (
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between gap-3 text-[12.5px] text-stone2-600">
            <span>{tier.name}</span>
            <span className="tabular-nums">
              {toNext} {toNext === 1 ? 'order' : 'orders'} to {next.name}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`Progress to ${next.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            className="h-3 overflow-hidden rounded-full border-2 border-stone2-900 bg-birch-100"
          >
            <div
              className="h-full bg-forest-700 transition-[width] duration-500"
              style={{ width: `${Math.max(4, progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      <Link
        href="/rewards"
        className="group mt-4 flex items-center gap-3 border-t-2 border-stone2-900/15 pt-4 text-[14px] text-stone2-900"
      >
        <Gift size={17} className="shrink-0 text-forest-700" strokeWidth={1.8} />
        <span className="min-w-0 flex-1">
          {ready > 0 ? (
            <>
              <strong>
                {ready} {ready === 1 ? 'reward' : 'rewards'}
              </strong>{' '}
              ready to use at the counter
            </>
          ) : best ? (
            <>
              You can redeem <strong>{best.name}</strong> now
            </>
          ) : upcoming ? (
            <>
              <strong className="tabular-nums">{upcoming.cost - points}</strong> points to{' '}
              <strong>{upcoming.name}</strong>
            </>
          ) : (
            'Every order earns points'
          )}
        </span>
        <ArrowRight
          size={15}
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </section>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border-2 border-stone2-900 px-2.5 py-0.5 text-[12px] font-semibold tabular-nums text-stone2-900">
      {children}
    </span>
  );
}
