import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Around the Bean — Coffee rooted in the forest',
}

/* ── Ticker ──────────────────────────────────────────────── */
function Ticker() {
  const items = [
    'Around the Bean', '·', 'UBC Vancouver', '·',
    'Est. 2018', '·', 'Family owned', '·',
    'Open Mon–Sun 7am–7pm', '·', 'Order & Reserve online', '·',
    'Around the Bean', '·', 'UBC Vancouver', '·',
    'Est. 2018', '·', 'Family owned', '·',
    'Open Mon–Sun 7am–7pm', '·', 'Order & Reserve online', '·',
  ]
  return (
    <div className="overflow-hidden border-b border-birch-200 bg-birch-100 py-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-forest-600 select-none">
      <div className="ticker-track">
        {items.map((t, i) => <span key={i}>{t}</span>)}
        {items.map((t, i) => <span key={`d${i}`}>{t}</span>)}
      </div>
    </div>
  )
}

/* ── Hero ────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
      {/* Copy */}
      <div>
        <div className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 rounded-full bg-forest-50 border border-forest-100 text-forest-700 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-pulse" />
          Now open · University Campus, Vancouver
        </div>

        <h1 className="font-body font-extrabold text-5xl sm:text-6xl md:text-[4rem] leading-[1.0] text-stone2-900 mb-3">
          Coffee rooted<br />in the
        </h1>
        <h1 className="font-display italic text-5xl sm:text-6xl md:text-[4rem] leading-[1.15] text-bark-500 mb-8">
          forest.
        </h1>

        <p className="text-stone2-600 text-[15px] leading-relaxed max-w-md mb-10">
          A small, family-run café tucked at the edge of campus. We source single-origin
          beans from around the world, brew them with care, and serve them in a space that
          feels like the Pacific Northwest — warm wood, natural light, and the smell of
          fresh coffee in the air.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/pickup" className="inline-flex items-center justify-center px-7 py-3.5 bg-forest-700 hover:bg-forest-800 active:scale-95 text-white font-bold rounded-full transition-all text-sm">
            Order for Pickup
          </Link>
          <Link href="/table"  className="inline-flex items-center justify-center px-7 py-3.5 border-2 border-forest-700 text-forest-700 hover:bg-forest-50 active:scale-95 font-bold rounded-full transition-all text-sm">
            Reserve a Table
          </Link>
        </div>

        {/* Hours badge */}
        <div className="mt-8 flex items-center gap-3 text-sm text-stone2-600">
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-stone2-900">Mon – Fri</span>
            <span>7 : 00 am – 7 : 00 pm</span>
          </div>
          <div className="w-px h-8 bg-birch-300" />
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-stone2-900">Sat – Sun</span>
            <span>8 : 00 am – 6 : 00 pm</span>
          </div>
        </div>
      </div>

      {/* Visual card */}
      <div className="relative hidden md:block">
        <div className="aspect-[4/5] rounded-3xl bg-birch-100 border border-birch-200 overflow-hidden relative">
          <div className="absolute inset-0 flex flex-col items-end justify-end p-6 gap-2 text-stone2-400">
            <p className="text-[11px] tracking-widest uppercase font-semibold">Café photo here</p>
          </div>
        </div>
        {/* Floating stat */}
        <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-lg border border-birch-200 p-4 w-44">
          <p className="text-[10px] text-stone2-400 font-semibold mb-1 uppercase tracking-wide">Today&apos;s special</p>
          <p className="font-bold text-stone2-900 text-sm">Yuzu Americano</p>
          <p className="text-xs text-bark-500 font-medium">Korean citrus · $5.50</p>
        </div>
        {/* Floating badge */}
        <div className="absolute -top-4 -right-4 bg-forest-700 rounded-full w-16 h-16 flex items-center justify-center shadow-md">
          <p className="text-[8px] font-bold tracking-widest uppercase text-white text-center leading-tight">
            Est.<br/>2018
          </p>
        </div>
      </div>
    </section>
  )
}

/* ── Quick actions ───────────────────────────────────────── */
function QuickActions() {
  const items = [
    { href: '/pickup', emoji: '☕', label: 'Order & Pickup', sub: 'Ready in ~10 min'  },
    { href: '/table',  emoji: '🌿', label: 'Reserve Table',  sub: 'Book your spot'    },
    { href: '/events', emoji: '🏡', label: 'Rent the Space', sub: 'Events & gatherings'},
    { href: '/menu',   emoji: '📋', label: 'Full Menu',      sub: 'Hot, iced & beans' },
  ]
  return (
    <section className="bg-white border-y border-birch-200 py-8 px-5">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(({ href, emoji, label, sub }) => (
          <Link key={href} href={href}
            className="group p-4 bg-birch-50 rounded-2xl border border-birch-200 hover:border-forest-300 hover:shadow-sm active:scale-95 transition-all">
            <span className="text-2xl block mb-2 leading-none">{emoji}</span>
            <p className="font-bold text-stone2-900 text-sm leading-snug">{label}</p>
            <p className="text-xs text-stone2-400 mt-0.5">{sub}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ── About the space ─────────────────────────────────────── */
function AboutSpace() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-16 md:py-24 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
      {/* Photos grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="aspect-[3/4] bg-birch-100 border border-birch-200 rounded-2xl overflow-hidden flex items-center justify-center text-stone2-400 text-xs font-semibold col-span-1">Interior</div>
        <div className="grid gap-3 col-span-1">
          <div className="aspect-square bg-birch-100 border border-birch-200 rounded-2xl overflow-hidden flex items-center justify-center text-stone2-400 text-xs font-semibold">Coffee bar</div>
          <div className="aspect-square bg-birch-100 border border-birch-200 rounded-2xl overflow-hidden flex items-center justify-center text-stone2-400 text-xs font-semibold">Corner table</div>
        </div>
        <div className="aspect-video bg-birch-100 border border-birch-200 rounded-2xl overflow-hidden flex items-center justify-center text-stone2-400 text-xs font-semibold col-span-2">Terrace · morning light</div>
      </div>

      {/* Copy */}
      <div>
        <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-4">The space</p>
        <h2 className="font-body font-extrabold text-3xl md:text-4xl text-stone2-900 leading-tight mb-6">
          A room that feels like<br />
          <span className="font-display italic text-bark-500">the woods.</span>
        </h2>

        <div className="space-y-4 text-stone2-600 text-[15px] leading-relaxed">
          <p>
            The café occupies a heritage building on the south edge of campus — exposed
            Douglas fir beams, a long wood counter that runs the full length of the room,
            and floor-to-ceiling windows that flood the space with Pacific Northwest light
            every morning.
          </p>
          <p>
            We have 34 seats across two zones: the main café floor with communal tables
            and banquettes, and a quieter back corner with armchairs and a bookshelf.
            The terrace seats another 16 when the weather allows.
          </p>
          <p>
            No loud music. No rush. Laptops welcome. Dogs on the terrace.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[['34', 'indoor seats'], ['16', 'terrace seats'], ['7am', 'opens daily']].map(([n, l]) => (
            <div key={l}>
              <p className="font-extrabold text-2xl text-forest-700">{n}</p>
              <p className="text-xs text-stone2-400 font-medium mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Menu preview ────────────────────────────────────────── */
const DRINKS = [
  { name: 'Pour Over',      price: '$6.50', notes: 'Floral · bergamot · honey',     cat: 'Filter'  },
  { name: 'Yuzu Americano', price: '$5.50', notes: 'Korean citrus · bright · bold', cat: 'Iced'    },
  { name: 'Cortado',        price: '$4.50', notes: 'Espresso · equal warm milk',    cat: 'Espresso'},
  { name: 'Hojicha Latte',  price: '$5.50', notes: 'Roasted green tea · oat milk',  cat: 'Hot'     },
]

function MenuPreview() {
  return (
    <section className="bg-birch-100 py-16 md:py-20 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-2">What we brew</p>
            <h2 className="font-body font-extrabold text-3xl md:text-4xl text-stone2-900">The menu</h2>
          </div>
          <Link href="/menu" className="text-forest-700 text-sm font-bold border-b-2 border-forest-700 pb-0.5 hover:opacity-70 transition-opacity">
            Full menu →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DRINKS.map(({ name, price, notes, cat }) => (
            <div key={name} className="p-5 bg-white rounded-2xl border border-birch-200 hover:border-forest-300 hover:shadow-md transition-all cursor-pointer">
              <div className="aspect-square rounded-xl bg-birch-100 mb-4 flex items-center justify-center text-2xl">☕</div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-bold text-stone2-900 text-sm leading-snug">{name}</p>
                <p className="text-bark-500 font-bold text-sm shrink-0">{price}</p>
              </div>
              <p className="text-xs text-stone2-400 leading-snug">{notes}</p>
              <span className="inline-block mt-2 text-[10px] font-bold tracking-widest uppercase text-forest-600 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-100">
                {cat}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Gallery ─────────────────────────────────────────────── */
function Gallery() {
  const photos = [
    { label: 'Morning rush',       span: 'col-span-2 row-span-2', aspect: 'aspect-auto h-72' },
    { label: 'Espresso pull',      span: 'col-span-1',            aspect: 'aspect-square'     },
    { label: 'Menu board',         span: 'col-span-1',            aspect: 'aspect-square'     },
    { label: 'Terrace',            span: 'col-span-1',            aspect: 'aspect-[4/3]'      },
    { label: 'Corner armchairs',   span: 'col-span-1',            aspect: 'aspect-[4/3]'      },
    { label: 'Bean bags on shelf', span: 'col-span-2',            aspect: 'aspect-[16/6]'     },
  ]

  return (
    <section className="max-w-6xl mx-auto px-5 py-16 md:py-20">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-2">The atmosphere</p>
          <h2 className="font-body font-extrabold text-3xl md:text-4xl text-stone2-900">
            Come see us
          </h2>
        </div>
      </div>

      {/* Mobile: simple 2-col grid */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {photos.map(({ label }) => (
          <div key={label} className="aspect-square bg-birch-100 border border-birch-200 rounded-2xl overflow-hidden flex items-center justify-center text-stone2-400 text-xs font-semibold">{label}</div>
        ))}
      </div>

      {/* Desktop: asymmetric grid */}
      <div className="hidden md:grid grid-cols-4 gap-3 auto-rows-[180px]">
        <div className="col-span-2 row-span-2 bg-birch-100 border border-birch-200 rounded-2xl overflow-hidden flex items-center justify-center text-stone2-400 text-xs font-semibold">{photos[0].label}</div>
        <div className="col-span-1 bg-birch-100 border border-birch-200 rounded-2xl overflow-hidden flex items-center justify-center text-stone2-400 text-xs font-semibold">{photos[1].label}</div>
        <div className="col-span-1 bg-birch-100 border border-birch-200 rounded-2xl overflow-hidden flex items-center justify-center text-stone2-400 text-xs font-semibold">{photos[2].label}</div>
        <div className="col-span-1 bg-birch-100 border border-birch-200 rounded-2xl overflow-hidden flex items-center justify-center text-stone2-400 text-xs font-semibold">{photos[3].label}</div>
        <div className="col-span-1 bg-birch-100 border border-birch-200 rounded-2xl overflow-hidden flex items-center justify-center text-stone2-400 text-xs font-semibold">{photos[4].label}</div>
        <div className="col-span-4 bg-birch-100 border border-birch-200 rounded-2xl overflow-hidden flex items-center justify-center text-stone2-400 text-xs font-semibold">{photos[5].label}</div>
      </div>

      <p className="text-center text-xs text-stone2-400 mt-4 font-medium">
        Replace bg-birch-100 border border-birch-200 rounded-2xl overflow-hidden flex items-center justify-center text-stone2-400 text-xs font-semibold placeholders with{' '}
        <code className="bg-birch-100 px-1.5 py-0.5 rounded text-stone2-600">&lt;Image fill&gt;</code>{' '}
        once real photos are ready.
      </p>
    </section>
  )
}

/* ── Events / Venue rental ───────────────────────────────── */
function Events() {
  const perks = [
    { icon: '🌿', title: 'Private buy-out',    body: 'Reserve the full café (50 cap.) for your event. Exclusive access to the space and bar.' },
    { icon: '☕', title: 'Full drink service', body: 'Our baristas stay on for the duration. Custom drink menu available for groups.' },
    { icon: '🎋', title: 'Flexible setup',     body: 'We rearrange furniture to suit your layout — seated dinner, standing reception, or workshop.' },
    { icon: '📷', title: 'Photo-friendly',     body: 'Natural light, wood tones, and plants make this a favourite for shoots and small productions.' },
  ]

  return (
    <section className="bg-forest-900 py-16 md:py-24 px-5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className="text-forest-300 text-xs font-bold tracking-[0.2em] uppercase mb-4">Venue rental</p>
          <h2 className="font-body font-extrabold text-3xl md:text-4xl text-white leading-tight mb-5">
            Host your next event<br />
            <span className="font-display italic text-bark-300">around the bean.</span>
          </h2>
          <p className="text-white/60 text-[15px] leading-relaxed">
            The café is available for private events outside opening hours —
            corporate breakfasts, product launches, team off-sites, birthday gatherings,
            photo shoots, and more. We handle the coffee. You handle the guest list.
          </p>
        </div>

        {/* Perks grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {perks.map(({ icon, title, body }) => (
            <div key={title} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-2xl block mb-3">{icon}</span>
              <p className="font-bold text-white text-sm mb-2">{title}</p>
              <p className="text-white/50 text-xs leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Capacity row */}
        <div className="grid grid-cols-3 gap-4 mb-12 border border-white/10 rounded-2xl p-6">
          {[['50', 'max capacity'], ['40', 'seated dinner'], ['16+', 'terrace add-on']].map(([n, l]) => (
            <div key={l} className="text-center">
              <p className="font-extrabold text-3xl text-bark-300">{n}</p>
              <p className="text-xs text-white/40 font-medium mt-1">{l}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/events"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-bark-500 hover:bg-bark-400 text-white font-bold rounded-full transition-colors text-sm">
            Inquire about an event
          </Link>
          <Link href="/events"
            className="inline-flex items-center justify-center px-8 py-3.5 border border-white/20 hover:bg-white/10 text-white font-medium rounded-full transition-colors text-sm">
            See event packages →
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── Family story ────────────────────────────────────────── */
function FamilyStory() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-16 md:py-24 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
      <div>
        <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-4">Our story</p>
        <h2 className="font-body font-extrabold text-3xl md:text-4xl text-stone2-900 leading-tight mb-6">
          Started by a family.<br />
          <span className="font-display italic text-bark-500">Run with heart.</span>
        </h2>
        <div className="space-y-4 text-stone2-600 text-[15px] leading-relaxed">
          <p>
            Around the Bean opened in 2018 when the Morales family moved to Vancouver and
            wanted to bring their love of specialty coffee to the neighbourhood they were
            calling home. What started as a pop-up at the Saturday farmers market grew into
            the café you see today.
          </p>
          <p>
            We work directly with small farms in Ethiopia, Colombia, and Panama — visiting
            when we can, paying fair prices always. Our Korean-inspired drinks are a nod to
            the flavours we discovered while travelling and fell in love with.
          </p>
          <p>
            Every person who works here is either family or has been with us long enough to
            feel like it. We hope you can feel that when you walk in.
          </p>
        </div>
        <Link href="/about"
          className="inline-block mt-8 text-forest-700 font-bold text-sm border-b-2 border-forest-700 pb-0.5 hover:opacity-70 transition-opacity">
          Meet the team →
        </Link>
      </div>

      {/* Photo placeholder */}
      <div className="aspect-[4/3] md:aspect-[3/4] rounded-3xl bg-birch-100 border border-birch-200 bg-birch-100 border border-birch-200 rounded-2xl overflow-hidden flex items-center justify-center text-stone2-400 text-xs font-semibold text-sm">
        Family photo
      </div>
    </section>
  )
}

/* ── Table CTA ───────────────────────────────────────────── */
function TableCTA() {
  return (
    <section className="px-5 pb-16">
      <div className="max-w-6xl mx-auto bg-birch-100 rounded-3xl border border-birch-200 px-7 py-10 md:flex md:items-center md:justify-between gap-8">
        <div className="mb-6 md:mb-0">
          <h3 className="font-body font-extrabold text-2xl md:text-3xl text-stone2-900 mb-2">
            Reserve your table.
          </h3>
          <p className="text-stone2-600 text-sm">
            Book a spot for up to 8 people — any day, any hour. No phone call needed.
          </p>
        </div>
        <Link href="/table"
          className="inline-flex items-center justify-center px-8 py-3.5 bg-forest-700 hover:bg-forest-800 text-white font-bold rounded-full transition-colors text-sm whitespace-nowrap active:scale-95">
          Reserve a Table
        </Link>
      </div>
    </section>
  )
}

/* ── Page ────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <Ticker />
      <Hero />
      <QuickActions />
      <AboutSpace />
      <MenuPreview />
      <Gallery />
      <Events />
      <FamilyStory />
      <TableCTA />
    </>
  )
}
