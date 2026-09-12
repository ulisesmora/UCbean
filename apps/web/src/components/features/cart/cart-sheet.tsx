'use client';

import { ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCartStore } from '@/stores/cart.store';
import { useEffect, useState } from 'react';

/**
 * The bag.
 *
 * It holds and prices the lines, and nothing else. Choosing a collection time
 * and placing the order live on the pickup page, which has the room to show a
 * whole day of slots. One checkout, one place to fix it.
 */
export function CartSheet() {
  const { items, isOpen, closeCart, removeItem, updateQty, totalItems, totalPrice } =
    useCartStore();

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
        <SheetContent className="flex w-full flex-col border-l-2 border-stone2-900 bg-birch-50 sm:max-w-md">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 bg-neon-500 ring-1 ring-stone2-900" />
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-stone2-600">
                Your order
              </span>
              {totalItems() > 0 && (
                <span className="rule-thin bg-neon-500 px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-stone2-900">
                  {totalItems()}
                </span>
              )}
            </SheetTitle>
            <p className="mt-2 text-left text-3xl font-extrabold leading-none text-stone2-900">
              The bag.
            </p>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-12">
              <ShoppingBag size={36} className="text-stone2-400" strokeWidth={1.4} />
              <p className="font-seal text-xl text-stone2-900">Nothing in the bag yet</p>
              <p className="max-w-[220px] font-mono text-[12px] leading-relaxed text-stone2-400">
                Browse the menu, or build your own drink from scratch.
              </p>
              <a href="/menu" className="btn mt-3 px-6 py-2.5 text-[14px]" onClick={closeCart}>
                Browse the menu
              </a>
            </div>
          ) : (
            <>
              <div className="-mx-6 flex-1 overflow-y-auto px-6">
                <ul className="rule divide-y-2 divide-stone2-900 bg-birch-50">
                  {items.map(({ lineId, label, ticket, qty, price }) => (
                    <li key={lineId} className="flex items-center gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-seal text-[16px] text-stone2-900">{label}</p>
                        {ticket && (
                          <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-forest-700">
                            {ticket}
                          </p>
                        )}
                        <p className="font-mono text-[11px] tabular-nums text-stone2-400">
                          ${price.toFixed(2)} each
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateQty(lineId, qty - 1)}
                          aria-label={`One fewer ${label}`}
                          className="tap-target flex h-8 w-8 items-center justify-center border-2 border-stone2-900 text-stone2-900 transition-colors hover:bg-neon-500"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center font-mono text-sm font-bold tabular-nums text-stone2-900">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateQty(lineId, qty + 1)}
                          aria-label={`One more ${label}`}
                          className="tap-target flex h-8 w-8 items-center justify-center border-2 border-stone2-900 text-stone2-900 transition-colors hover:bg-neon-500"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => removeItem(lineId)}
                          aria-label={`Remove ${label}`}
                          className="tap-target ml-1 flex h-8 w-8 items-center justify-center text-stone2-400 transition-colors hover:text-bark-700"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <p className="w-16 shrink-0 text-right font-mono text-sm font-bold tabular-nums text-stone2-900">
                        ${(price * qty).toFixed(2)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4 pt-5">
                <div className="rule flex items-center justify-between bg-birch-50 px-4 py-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone2-600">
                    Total
                  </span>
                  <span className="font-mono text-xl font-bold tabular-nums text-stone2-900">
                    ${totalPrice().toFixed(2)}
                  </span>
                </div>
                <Link
                  href="/pickup"
                  onClick={closeCart}
                  className="btn btn-acid flex h-12 w-full items-center justify-center text-[15px]"
                >
                  Choose a pickup time
                </Link>
                <p className="text-center font-mono text-[11px] text-stone2-400">
                  Pickup orders are ready in 10 to 15 minutes
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export function CartButton() {
  const { toggleCart, totalItems } = useCartStore();
  // The cart is persisted in localStorage, so the server renders a count of
  // zero and the client rehydrates a different one. Holding the badge back
  // until after mount is what keeps the two trees identical.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? totalItems() : 0;

  return (
    <button onClick={toggleCart} className="btn btn-acid tap-target relative px-5 py-2 text-[13px]">
      <ShoppingBag size={14} />
      <span className="hidden sm:inline">Order</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center  bg-bark-500 text-[10px] font-bold text-stone2-900">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
