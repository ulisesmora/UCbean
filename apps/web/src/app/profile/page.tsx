'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Package, CalendarDays, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ordersApi, reservationsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';
import { AuthModal } from '@/components/features/auth/auth-modal';
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
          <User size={40} className="text-birch-300 mx-auto mb-4" strokeWidth={1.4} />
          <h1 className="font-body font-bold text-2xl text-stone2-900 mb-2">Sign in to continue</h1>
          <p className="text-stone2-400 text-sm mb-6">View your orders and reservations.</p>
          <Button
            onClick={() => setShowAuth(true)}
            className="bg-forest-700 hover:bg-forest-800 text-white"
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

      {/* Orders */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-forest-700" />
          <h2 className="font-bold text-stone2-900 text-base">Order history</h2>
        </div>
        {loadingOrders ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-stone2-400 text-sm py-4">No orders yet. Browse the menu!</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="p-4 bg-white rounded-xl border border-birch-200">
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
                <p className="text-sm text-stone2-600">
                  {order.items.map((i) => `${i.qty}x ${i.productName}`).join(', ')}
                </p>
                <p className="text-sm font-bold text-stone2-900 mt-1">
                  ${Number(order.total).toFixed(2)}
                </p>
              </div>
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
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <p className="text-stone2-400 text-sm py-4">No reservations yet. Book a table!</p>
        ) : (
          <div className="space-y-3">
            {reservations.map((r) => (
              <div key={r.id} className="p-4 bg-white rounded-xl border border-birch-200">
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
