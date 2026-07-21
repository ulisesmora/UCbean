import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Menu' }

const CATEGORIES = ['Hot', 'Iced', 'Filter', 'Beans'] as const

const DRINKS = [
  { name: 'Americano',            price: 4.00, cat: 'Hot',    notes: 'Double espresso, hot water.' },
  { name: 'Latte',                price: 5.00, cat: 'Hot',    notes: 'Espresso with steamed milk.' },
  { name: 'Cortado',              price: 4.50, cat: 'Hot',    notes: 'Espresso, equal warm milk.' },
  { name: 'Flat White',           price: 5.00, cat: 'Hot',    notes: 'Velvet microfoam, ristretto.' },
  { name: 'Hojicha Latte',        price: 5.50, cat: 'Hot',    notes: 'Roasted green tea, oat milk.' },
  { name: 'Pour Over',            price: 6.50, cat: 'Filter', notes: 'Single origin, V60.' },
  { name: 'Cold Brew',            price: 5.50, cat: 'Iced',   notes: '18 hour steep. Black.' },
  { name: 'Iced Americano',       price: 4.50, cat: 'Iced',   notes: 'Smooth, low acid, refreshing.' },
  { name: 'Dalgona Latte',        price: 6.00, cat: 'Iced',   notes: 'Whipped coffee over milk.' },
  { name: 'Yuzu Americano',       price: 5.50, cat: 'Iced',   notes: 'Korean citrus + espresso.' },
  { name: 'Misugaru Latte',       price: 6.00, cat: 'Iced',   notes: 'Roasted multigrain. Nutty.' },
  { name: 'Ethiopia Yirgacheffe', price: 22.00, cat: 'Beans', notes: 'Floral · bergamot · honey. 250g' },
  { name: 'Panama Geisha',        price: 32.00, cat: 'Beans', notes: 'Jasmine · stone fruit. 250g' },
  { name: 'House Blend',          price: 18.00, cat: 'Beans', notes: 'Chocolate · walnut. 250g' },
]

export default function MenuPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 py-12 md:py-16">
      <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-2">What we brew</p>
      <h1 className="font-body font-extrabold text-4xl md:text-5xl text-stone2-900 mb-2">The Menu</h1>
      <p className="text-stone2-600 text-[15px] mb-12 max-w-lg">
        Single-origin beans, Korean-inspired drinks, and seasonal specials. Everything is made to order.
      </p>

      {CATEGORIES.map((cat) => (
        <section key={cat} className="mb-12">
          <h2 className="font-display italic text-2xl text-bark-500 mb-5 pb-3 border-b border-birch-200">
            {cat}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DRINKS.filter((d) => d.cat === cat).map(({ name, price, notes }) => (
              <div key={name} className="p-5 bg-white rounded-2xl border border-birch-200 hover:border-forest-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-bold text-stone2-900 text-sm">{name}</p>
                  <p className="text-bark-500 font-bold text-sm shrink-0">${price.toFixed(2)}</p>
                </div>
                <p className="text-xs text-stone2-400 leading-relaxed">{notes}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
