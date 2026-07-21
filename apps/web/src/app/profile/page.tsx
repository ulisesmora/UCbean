import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Account' }

export default function ProfilePage() {
  return (
    <div className="max-w-xl mx-auto px-5 py-16 text-center">
      <span className="text-5xl block mb-6">👤</span>
      <h1 className="font-body font-extrabold text-3xl text-espresso-900 mb-3">Your Account</h1>
      <p className="text-espresso-900/50 mb-8">Sign in to see your orders and reservations.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a href="/login" className="inline-flex items-center justify-center px-7 py-3.5 bg-sakura-700 text-white font-bold rounded-full text-sm">
          Sign in
        </a>
        <a href="/register" className="inline-flex items-center justify-center px-7 py-3.5 border-2 border-sakura-700 text-sakura-700 font-bold rounded-full text-sm">
          Create account
        </a>
      </div>
    </div>
  )
}
