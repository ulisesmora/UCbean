'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { reservationsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { AuthModal } from '@/components/features/auth/auth-modal';
import { toast } from 'sonner';
import { useCartStore } from '@/stores/cart.store';
import { useCheckout } from '@/hooks/use-cart';

export default function PickupPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [done, setDone] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { items, totalPrice } = useCartStore();
  const checkout = useCheckout();

  const { data: slotData, isLoading } = useQuery({
    queryKey: ['pickup-slots', date],
    queryFn: () => reservationsApi.pickupSlots(date),
    enabled: !!date,
  });

  function handleOrder() {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }
    if (!selectedSlot) {
      toast.error('Please select a pickup time');
      return;
    }
    if (items.length === 0) {
      toast.error('Add items to your cart first');
      return;
    }

    checkout.mutate('PICKUP', {
      onSuccess: () => {
        setDone(true);
        toast.success('Order placed! See you at ' + selectedSlot);
      },
      onError: (e) => toast.error(e.message),
    });
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <CheckCircle2 size={48} className="text-forest-700 mx-auto mb-4" strokeWidth={1.5} />
        <h1 className="font-body font-bold text-2xl text-stone2-900 mb-2">Order confirmed!</h1>
        <p className="text-stone2-600 text-sm mb-6">
          Ready for pickup at <strong>{selectedSlot}</strong> on {date}.
        </p>
        <Button
          onClick={() => {
            setDone(false);
            setSelectedSlot(null);
          }}
          variant="outline"
          className="border-forest-700 text-forest-700"
        >
          Place another order
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-5 py-12 md:py-16">
        <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-2">
          Skip the line
        </p>
        <h1 className="font-body font-extrabold text-4xl md:text-5xl text-stone2-900 mb-2">
          Order &amp; Pickup
        </h1>
        <p className="text-stone2-600 text-[15px] mb-10 max-w-md">
          Order ahead, pick up in 10–15 minutes. No waiting.
        </p>

        {/* Date picker */}
        <section className="mb-8">
          <h2 className="font-semibold text-stone2-900 text-sm mb-3">Pickup date</h2>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => {
              setDate(e.target.value);
              setSelectedSlot(null);
            }}
            className="px-4 py-2.5 rounded-xl border border-birch-200 bg-white text-stone2-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-700"
          />
        </section>

        {/* Time slots */}
        <section className="mb-10">
          <h2 className="font-semibold text-stone2-900 text-sm mb-3">Pickup time</h2>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-xl" />
              ))}
            </div>
          ) : !slotData?.slots?.length ? (
            <p className="text-stone2-400 text-sm">No slots available for this date.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slotData.slots.map((slot) => {
                const full = slot.available === 0;
                const active = selectedSlot === slot.time;
                return (
                  <button
                    key={slot.time}
                    disabled={full}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`flex flex-col items-center py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                      full
                        ? 'border-birch-200 bg-birch-100 text-stone2-300 cursor-not-allowed'
                        : active
                          ? 'border-forest-700 bg-forest-700 text-white'
                          : 'border-birch-200 bg-white text-stone2-700 hover:border-forest-400'
                    }`}
                  >
                    <Clock size={13} className="mb-1" />
                    {slot.time}
                    {full && <span className="text-[10px] mt-0.5">Full</span>}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Cart summary + CTA */}
        <div className="p-5 bg-white rounded-2xl border border-birch-200">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-stone2-900 text-sm">
              {items.length === 0
                ? 'No items yet'
                : `${items.reduce((s, i) => s + i.qty, 0)} items`}
            </span>
            {items.length > 0 && (
              <span className="font-bold text-stone2-900">${totalPrice().toFixed(2)}</span>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-stone2-400 mb-4">Add items from the menu first.</p>
          ) : null}
          <Button
            onClick={handleOrder}
            disabled={checkout.isPending || items.length === 0 || !selectedSlot}
            className="w-full bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl h-12"
          >
            {checkout.isPending
              ? 'Placing order...'
              : !selectedSlot
                ? 'Select a pickup time'
                : 'Place pickup order'}
          </Button>
        </div>
      </div>

      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </>
  );
}
