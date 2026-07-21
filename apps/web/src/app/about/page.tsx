import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Our Story' }

export default function AboutPage() {
  return (
    <>
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-12 md:pt-24 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div>
          <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-4">Our story</p>
          <h1 className="font-body font-extrabold text-4xl md:text-5xl text-stone2-900 leading-tight mb-6">
            A coffee shop rooted<br />
            <span className="font-display italic text-bark-500">in community.</span>
          </h1>
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
              flavours we discovered while travelling and fell in love with.
            </p>
            <p>
              Every person who works here is either family or has been with us long enough to
              feel like it. We hope you can feel that when you walk in.
            </p>
          </div>
        </div>
        <div className="aspect-[3/4] rounded-3xl bg-birch-100 border border-birch-200 flex items-center justify-center text-stone2-400 text-sm font-semibold">
          Family photo
        </div>
      </section>

      {/* Space */}
      <section className="bg-birch-100 border-y border-birch-200 py-16 px-5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-4">The space</p>
            <h2 className="font-body font-extrabold text-3xl text-stone2-900 mb-5">
              Heritage building.<br />
              <span className="font-display italic text-bark-500">Pacific Northwest light.</span>
            </h2>
            <div className="space-y-3 text-stone2-600 text-[15px] leading-relaxed">
              <p>The café sits in a 1940s heritage building on the south edge of campus — exposed Douglas fir beams, a long wood counter, and floor-to-ceiling windows.</p>
              <p>34 indoor seats, 16 on the terrace. A quiet reading corner with armchairs and a community bookshelf. Laptops welcome. Dogs on the terrace.</p>
            </div>
          </div>
          <div className="aspect-[4/3] rounded-3xl bg-birch-200 border border-birch-300 flex items-center justify-center text-stone2-400 text-sm font-semibold">
            Interior photo
          </div>
        </div>
      </section>

      {/* Sourcing */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-4">Sourcing</p>
        <h2 className="font-body font-extrabold text-3xl text-stone2-900 mb-8">Where our beans come from</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { country: 'Ethiopia', region: 'Yirgacheffe', notes: 'Floral · bergamot · honey' },
            { country: 'Colombia', region: 'Huila',       notes: 'Caramel · red apple' },
            { country: 'Panama',   region: 'Geisha',      notes: 'Jasmine · stone fruit' },
          ].map(({ country, region, notes }) => (
            <div key={country} className="p-5 bg-white rounded-2xl border border-birch-200 hover:border-forest-300 transition-all">
              <p className="font-extrabold text-stone2-900 mb-0.5">{country}</p>
              <p className="text-xs text-forest-600 font-semibold mb-3">{region}</p>
              <p className="text-sm text-stone2-400">{notes}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-16">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3">
          <Link href="/table" className="inline-flex items-center justify-center px-7 py-3.5 bg-forest-700 hover:bg-forest-800 text-white font-bold rounded-full text-sm transition-colors">
            Reserve a table
          </Link>
          <Link href="/events" className="inline-flex items-center justify-center px-7 py-3.5 border-2 border-forest-700 text-forest-700 hover:bg-forest-50 font-bold rounded-full text-sm transition-colors">
            Host an event →
          </Link>
        </div>
      </section>
    </>
  )
}
