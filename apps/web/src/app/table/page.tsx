'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { reservationsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { AuthModal } from '@/components/features/auth/auth-modal';
import { toast } from 'sonner';

const schema = z.object({
  partySize: z.number({ coerce: true }).int().min(1).max(16),
  date: z.string().min(1, 'Choose a date'),
  time: z.string().min(1, 'Choose a time'),
  notes: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export default function TablePage() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { partySize: 2 },
  });

  const book = useMutation({
    mutationFn: (values: Values) =>
      reservationsApi.bookTable(
        {
          partySize: values.partySize,
          scheduledAt: `${values.date}T${values.time}:00`,
          notes: values.notes,
        },
        accessToken!,
      ),
    onSuccess: () => setDone(true),
    onError: (e) => toast.error(e.message),
  });

  function onSubmit(data: Values) {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }
    book.mutate(data);
  }

  const today = new Date().toISOString().split('T')[0];

  if (done) {
    const v = getValues();
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <CheckCircle2 size={48} className="text-forest-700 mx-auto mb-4" strokeWidth={1.5} />
        <h1 className="font-body font-bold text-2xl text-stone2-900 mb-2">Table reserved!</h1>
        <p className="text-stone2-600 text-sm mb-6">
          {v.partySize} guests · {v.date} at {v.time}
        </p>
        <Button
          onClick={() => setDone(false)}
          variant="outline"
          className="border-stone2-900 text-forest-700"
        >
          Make another reservation
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto px-5 py-12 md:py-16">
        <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-2">
          Dine with us
        </p>
        <h1 className="font-body font-extrabold text-4xl md:text-5xl text-stone2-900 mb-2">
          Reserve a Table
        </h1>
        <p className="text-stone2-600 text-[15px] mb-10 max-w-md">
          Book your spot in our cozy space. We keep it simple — show up, settle in.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 glass glass-edge p-6">
          {/* Party size */}
          <div className="space-y-1.5">
            <Label className="text-stone2-700 font-semibold text-sm">Party size</Label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <label key={n} className="cursor-pointer">
                  <input
                    type="radio"
                    value={n}
                    {...register('partySize', { valueAsNumber: true })}
                    className="sr-only peer"
                  />
                  <span className="flex items-center justify-center h-10  border border-birch-200 text-sm font-semibold text-stone2-600 peer-checked:bg-neon-500 peer-checked:text-stone2-900 peer-checked:border-stone2-900 transition-all">
                    {n}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-stone2-400">
              For larger groups (9+), contact us directly.
            </p>
            {errors.partySize && <p className="text-xs text-red-500">{errors.partySize.message}</p>}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="res-date" className="text-stone2-700 font-semibold text-sm">
              Date
            </Label>
            <Input
              id="res-date"
              type="date"
              min={today}
              className="border-birch-200 focus-visible:ring-stone2-900"
              {...register('date')}
            />
            {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
          </div>

          {/* Time */}
          <div className="space-y-1.5">
            <Label htmlFor="res-time" className="text-stone2-700 font-semibold text-sm">
              Time
            </Label>
            <Input
              id="res-time"
              type="time"
              min="07:00"
              max="19:00"
              step="900"
              className="border-birch-200 focus-visible:ring-stone2-900"
              {...register('time')}
            />
            {errors.time && <p className="text-xs text-red-500">{errors.time.message}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="res-notes" className="text-stone2-700 font-semibold text-sm">
              Notes <span className="text-stone2-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="res-notes"
              placeholder="Accessibility needs, celebrations, preferences..."
              className="border-birch-200 focus-visible:ring-stone2-900"
              {...register('notes')}
            />
          </div>

          <Button
            type="submit"
            disabled={book.isPending}
            className="w-full bg-neon-500 hover:bg-neon-600 text-stone2-900 font-semibold  h-12"
          >
            {book.isPending ? 'Reserving...' : 'Reserve table'}
          </Button>
        </form>
      </div>

      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </>
  );
}
