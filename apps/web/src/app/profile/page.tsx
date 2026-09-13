'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, CalendarDays, Coffee, Heart, LogOut, Share2, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { favoritesApi, ordersApi, reservationsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';
import { AuthModal } from '@/components/features/auth/auth-modal';
import { useFavorites, useRemoveFavorite } from '@/hooks/use-favorites';
import { RepeatSheet } from '@/components/features/menu/customise-sheet';
import type { Build } from '@/lib/builder';
import type { FavoriteDrink } from '@/types/api.types';
import { productImage } from '@/lib/images';
import { shareDrink } from '@/lib/share';
import { useProducts } from '@/hooks/use-products';
import { LoyaltySummary } from '@/components/features/account/loyalty-summary';
import { GoogleReturn } from '@/components/features/auth/google-return';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-purple-100 text-purple-700',
  READY: 'bg-forest-100 text-forest-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-500',
};

export default function ProfilePage() {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);
  const logout = useLogout();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) setShowAuth(true);
  }, [isAuthenticated]);

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.myOrders(accessToken!),
    enabled: isAuthenticated && !!accessToken,
  });

  const { data: reservations = [], isLoading: loadingRes } = useQuery({
    queryKey: ['my-table-reservations'],
    queryFn: () => reservationsApi.myTableReservations(accessToken!),
    enabled: isAuthenticated && !!accessToken,
  });

  // The line only carries the name. The catalogue knows the section, which
  // is what picks the same photo the menu shows.
  const { data: products } = useProducts();
  const catalogue = new Map((products ?? []).map((p) => [p.id, p]));

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast.success('Signed out');
        router.push('/');
      },
    });
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="max-w-lg mx-auto px-5 py-20 text-center">
          <GoogleReturn />
          <User size={40} className="text-birch-300 mx-auto mb-4" strokeWidth={1.4} />
          <h1 className="font-body font-bold text-2xl text-stone2-900 mb-2">Sign in to continue</h1>
          <p className="text-stone2-400 text-sm mb-6">View your orders and reservations.</p>
          <Button
            onClick={() => setShowAuth(true)}
            className="bg-neon-500 hover:bg-neon-600 text-stone2-900"
          >
            Sign in
          </Button>
        </div>
        <AuthModal open={showAuth} onOpenChange={setShowAuth} />
      </>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-12 md:py-16">
      <GoogleReturn />

      {/* User header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-1">
            Account
          </p>
          <h1 className="font-body font-extrabold text-3xl text-stone2-900">{user?.name}</h1>
          <p className="text-stone2-400 text-sm mt-0.5">{user?.email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={logout.isPending}
          className="border-birch-200 text-stone2-600 gap-1.5"
        >
          <LogOut size={14} />
          Sign out
        </Button>
      </div>

      <LoyaltySummary className="mb-10" />

      <Usuals />

      {/* Orders */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-forest-700" />
          <h2 className="font-bold text-stone2-900 text-base">Order history</h2>
        </div>
        {loadingOrders ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 " />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-stone2-400 text-sm py-4">No orders yet. Browse the menu!</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/order/${order.id}`}
                className="block p-4 glass glass-edge glass-hover"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-stone2-400">
                    {new Date(order.createdAt).toLocaleDateString('en-CA', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <Badge
                    className={`text-[10px] font-semibold ${STATUS_COLORS[order.status] ?? ''}`}
                  >
                    {order.status}
                  </Badge>
                </div>
                <ul className="flex flex-col gap-2">
                  {order.items.map((i, n) => (
                    <li key={`${order.id}-${n}`} className="flex items-center gap-3">
                      <Thumb
                        src={productImage(
                          catalogue.get(i.productId) ?? {
                            name: i.name ?? i.productName,
                            imageUrl: i.imageUrl,
                          },
                        )}
                        alt={i.name ?? i.productName}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-stone2-900">
                          {i.qty}x {i.name ?? i.productName}
                        </span>
                        {i.ticket && (
                          <span className="block truncate text-[11px] uppercase tracking-[0.1em] text-stone2-400">
                            {i.ticket}
                          </span>
                        )}
                      </span>
                      <span className="text-[13px] tabular-nums text-stone2-600">
                        ${Number(i.subtotal).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 border-t-2 border-stone2-900/15 pt-2 text-right text-sm font-bold text-stone2-900">
                  ${Number(order.total).toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Separator className="bg-birch-200 mb-10" />

      {/* Reservations */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={16} className="text-forest-700" />
          <h2 className="font-bold text-stone2-900 text-base">Table reservations</h2>
        </div>
        {loadingRes ? (
          <div className="space-y-3">
            {[1].map((i) => (
              <Skeleton key={i} className="h-16 " />
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <p className="text-stone2-400 text-sm py-4">No reservations yet. Book a table!</p>
        ) : (
          <div className="space-y-3">
            {reservations.map((r) => (
              <div key={r.id} className="p-4 glass glass-edge">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone2-900">
                      {new Date(r.scheduledAt).toLocaleDateString('en-CA', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-stone2-400 mt-0.5">{r.partySize} guests</p>
                  </div>
                  <Badge
                    className={`text-[10px] font-semibold ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {r.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** La foto de una línea del historial, con hueco reservado cuando no hay. */
function Thumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[9px] border-2 border-stone2-900 bg-birch-100">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- del CDN del API
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <Coffee size={16} className="text-stone2-400" strokeWidth={1.5} />
      )}
    </span>
  );
}

/**
 * Lo de siempre.
 *
 * Va encima del historial porque repetir es lo que más se hace aquí: el
 * historial se mira de vez en cuando, las guardadas se usan cada mañana.
 */
function Usuals() {
  const { data: favorites = [], isLoading } = useFavorites();
  const remove = useRemoveFavorite();
  const { accessToken } = useAuthStore();
  const [again, setAgain] = useState<FavoriteDrink | null>(null);

  if (isLoading || favorites.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        <Heart size={16} className="text-bark-700" />
        <h2 className="text-base font-bold text-stone2-900">Your usuals</h2>
        <Link
          href="/order"
          className="ml-auto text-[13px] font-semibold text-stone2-900 underline underline-offset-4"
        >
          Order from your usuals
        </Link>
      </div>
      <div className="flex flex-col gap-2.5">
        {favorites.map((f) => (
          <div key={f.id} className="glass glass-edge flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-stone2-900">{f.name}</p>
              <p className="truncate text-[11px] uppercase tracking-[0.1em] text-forest-700">
                {f.ticket}
              </p>
              <p className="text-[12px] tabular-nums text-stone2-400">
                ${f.price.toFixed(2)}
                {f.timesOrdered > 0 && ` · ordered ${f.timesOrdered} times`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAgain(f)}
              className="btn btn-acid tap-target px-4 py-2 text-[13px]"
            >
              Order again
            </button>
            {/* Regalar una bebida: la fórmula viaja dentro del enlace, así
                que no se comparte nada tuyo, solo la receta. */}
            <button
              type="button"
              onClick={async () => {
                const r = await shareDrink(f.build, f.name);
                if (r === 'copied') toast.success('Link copied. Send it to whoever you like.');
                if (r === 'failed') toast.error('Could not copy the link');
              }}
              aria-label={`Share ${f.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone2-400 transition-colors hover:bg-stone2-900/8 hover:text-forest-700"
            >
              <Share2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => remove.mutate(f.id)}
              aria-label={`Forget ${f.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone2-400 transition-colors hover:bg-stone2-900/8 hover:text-bark-700"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <RepeatSheet
        line={
          again
            ? {
                productId: again.productId,
                label: again.name,
                build: again.build as Build,
                recipeId: again.recipeId,
              }
            : null
        }
        open={again !== null}
        onOpenChange={(v) => {
          if (!v) setAgain(null);
        }}
        onAdded={() => {
          if (again && accessToken)
            favoritesApi.markOrdered(again.id, accessToken).catch(() => undefined);
        }}
      />
    </section>
  );
}
