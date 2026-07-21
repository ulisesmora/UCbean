import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cart' }

export default function OrderPage() {
  return (
    <div className="max-w-xl mx-auto px-5 py-16 text-center">
      <span className="text-5xl block mb-6">🛍️</span>
      <h1 className="font-body font-extrabold text-3xl text-espresso-900 mb-3">Your Cart</h1>
      <p className="text-espresso-900/50">Your cart is empty. Add something from the menu!</p>
    </div>
  )
}
