import Link from 'next/link';
import type { Metadata } from 'next';
import { Photo } from '@/components/ui/photo';

export const metadata: Metadata = { title: 'Our Story' };

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-14 pt-20 md:pt-28 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div>
          <p className="mb-5 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-stone2-600">
            <span className="h-2.5 w-2.5 bg-neon-500 ring-1 ring-stone2-900" />
            Our story
          </p>
          <h1 className="mb-7 text-4xl font-extrabold leading-[1.0] text-stone2-900 md:text-5xl">
            A coffee shop rooted
            <br />
            <span className="marker font-seal italic">in community.</span>
          </h1>
          <div className="space-y-4 text-[16px] leading-relaxed text-stone2-600">
            <p>
              Around the Bean opened in 2018 when the Morales family moved to Vancouver and wanted
              to bring their love of specialty coffee to the neighbourhood they were calling home.
              What started as a pop-up at the Saturday farmers market grew into the café you see
              today.
            </p>
            <p>
              We work directly with small farms in Ethiopia, Colombia, and Panama — visiting when we
              can, paying fair prices always. Our Korean-inspired drinks are a nod to flavours we
              discovered while travelling and fell in love with.
            </p>
            <p>
              Every person who works here is either family or has been with us long enough to feel
              like it. We hope you can feel that when you walk in.
            </p>
          </div>
        </div>
        <Photo
          src="family.jpg"
          label="The counter nook"
          alt="A cup and a pastry on the window counter, under trailing plants"
          className="aspect-[3/4]"
          sizes="(max-width: 768px) 100vw, 45vw"
          priority
        />
      </section>

      {/* Space */}
      <section className="bloom bloom-alt relative overflow-hidden border-y-2 border-stone2-900 px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="mb-5 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-stone2-600">
              <span className="h-2.5 w-2.5 bg-neon-500 ring-1 ring-stone2-900" />
              The space
            </p>
            <h2 className="font-body font-extrabold text-3xl text-stone2-900 mb-5">
              Heritage building.
              <br />
              <span className="font-seal italic">Pacific Northwest light.</span>
            </h2>
            <div className="space-y-3 text-[16px] leading-relaxed text-stone2-600">
              <p>
                The café sits in a 1940s heritage building on the south edge of campus — exposed
                Douglas fir beams, a long wood counter, and floor-to-ceiling windows.
              </p>
              <p>
                34 indoor seats, 16 on the terrace. A quiet reading corner with armchairs and a
                community bookshelf. Laptops welcome. Dogs on the terrace.
              </p>
            </div>
          </div>
          <Photo
            src="interior.jpg"
            label="Interior"
            alt="The main café floor seen from the entrance"
            className="aspect-[4/3]"
            sizes="(max-width: 768px) 100vw, 45vw"
          />
        </div>
      </section>

      {/* Sourcing */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="mb-5 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-stone2-600">
          <span className="h-2.5 w-2.5 bg-neon-500 ring-1 ring-stone2-900" />
          Sourcing
        </p>
        <h2 className="font-body font-extrabold text-3xl text-stone2-900 mb-8">
          Where our beans come from
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { country: 'Ethiopia', region: 'Yirgacheffe', notes: 'Floral · bergamot · honey' },
            { country: 'Colombia', region: 'Huila', notes: 'Caramel · red apple' },
            { country: 'Panama', region: 'Geisha', notes: 'Jasmine · stone fruit' },
          ].map(({ country, region, notes }) => (
            <div
              key={country}
              className="p-5 glass glass-edge hover:border-stone2-900 transition-all"
            >
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
          <Link
            href="/table"
            className="inline-flex items-center justify-center px-7 py-3.5 bg-neon-500 hover:bg-neon-600 text-stone2-900 font-bold  text-sm transition-colors"
          >
            Reserve a table
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center justify-center px-7 py-3.5 border-2 border-stone2-900 text-forest-700 hover:bg-forest-50 font-bold  text-sm transition-colors"
          >
            Host an event →
          </Link>
        </div>
      </section>
    </>
  );
}
