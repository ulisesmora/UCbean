import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reserve a Table' }

export default function TablePage() {
  return (
    <div className="max-w-xl mx-auto px-5 py-16 text-center">
      <span className="text-5xl block mb-6">🪑</span>
      <h1 className="font-body font-extrabold text-3xl text-espresso-900 mb-3">Reserve a Table</h1>
      <p className="text-espresso-900/50 mb-8">Pick a date, time, and number of guests. We&apos;ll hold your spot.</p>
      <p className="text-sakura-700 text-sm font-semibold bg-sakura-100 rounded-2xl px-5 py-3 inline-block">
        Coming soon — Phase 4
      </p>
    </div>
  )
}
