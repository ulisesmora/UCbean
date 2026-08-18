'use client';

import { ShoppingBag, Plus, Minus, Trash2, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { AuthModal } from '@/components/features/auth/auth-modal';
import { useState } from 'react';
import { useCheckout } from '@/hooks/use-cart';
import { toast } from 'sonner';

export function CartSheet() {
  const { items, isOpen, closeCart, removeItem, updateQty, totalItems, totalPrice } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();
  const checkout = useCheckout();
  const [showAuth, setShowAuth] = useState(false);

  function handleCheckout() {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }
    checkout.mutate('PICKUP', {
      onSuccess: () => {
        closeCart();
        toast.success("Order placed! We'll start preparing it shortly.");
      },
      onError: (e) => toast.error(e.message),
    });
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
        <SheetContent className="flex flex-col w-full sm:max-w-md bg-birch-50 border-birch-200">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 font-body font-bold text-stone2-900">
              <ShoppingBag size={18} className="text-forest-700" />
              Your Order
              {totalItems() > 0 && (
                <Badge className="bg-forest-700 text-white text-xs ml-1">{totalItems()}</Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-12">
              <ShoppingBag size={40} className="text-birch-300" strokeWidth={1.4} />
              <p className="font-semibold text-stone2-900 text-sm">Your cart is empty</p>
              <p className="text-stone2-400 text-xs max-w-[200px]">
                Browse the menu and add something delicious.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-forest-700 text-forest-700"
                onClick={closeCart}
              >
                Browse Menu
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-3">
                {items.map(({ product, qty }) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-birch-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-stone2-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-stone2-400">
                        ${Number(product.price).toFixed(2)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQty(product.id, qty - 1)}
                        className="w-7 h-7 rounded-full border border-birch-200 flex items-center justify-center text-stone2-600 hover:bg-birch-100 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-stone2-900">
                        {qty}
                      </span>
                      <button
                        onClick={() => updateQty(product.id, qty + 1)}
                        className="w-7 h-7 rounded-full border border-birch-200 flex items-center justify-center text-stone2-600 hover:bg-birch-100 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-stone2-400 hover:text-red-500 transition-colors ml-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <p className="text-sm font-bold text-bark-500 shrink-0 w-14 text-right">
                      ${(product.price * qty).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-4">
                <Separator className="bg-birch-200" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-stone2-600 text-sm">Total</span>
                  <span className="font-bold text-lg text-stone2-900">
                    ${totalPrice().toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={handleCheckout}
                  disabled={checkout.isPending}
                  className="w-full bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl h-12"
                >
                  {checkout.isPending ? 'Placing order...' : 'Place Order · Pickup'}
                </Button>
                <p className="text-center text-[11px] text-stone2-400">
                  Pickup orders ready in 10–15 min
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </>
  );
}

export function CartButton() {
  const { toggleCart, totalItems } = useCartStore();
  const count = totalItems();

  return (
    <button
      onClick={toggleCart}
      className="relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 transition-colors tap-target"
    >
      <ShoppingBag size={14} />
      <span className="hidden sm:inline">Order</span>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-bark-400 text-white text-[10px] font-bold flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
