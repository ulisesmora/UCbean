import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Events & Venue Rental' };

const PACKAGES = [
  {
    name: 'Morning Gathering',
    time: 'Before 10 am',
    price: 'From $280',
    cap: 'Up to 30 guests',
    includes: [
      '2 hours exclusive access',
      'Drip coffee & tea station',
      'Pastry selection',
      'Basic furniture setup',
    ],
  },
  {
    name: 'Full Buyout',
    time: 'After 7 pm',
    price: 'From $680',
    cap: 'Up to 50 guests',
    includes: [
      '4 hours exclusive access',
      'Full barista service',
      'Custom drink menu',
      'Furniture rearrangement',
      'Terrace access',
    ],
    featured: true,
  },
  {
    name: 'Photo / Film Shoot',
    time: 'Flexible',
    price: 'From $420',
    cap: '6-person crew max',
    includes: [
      '3 hours exclusive access',
      'Barista on-site',
      'All natural light areas',
      'Props from the shelf',
    ],
  },
];

export default function EventsPage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-12 md:pt-24">
        <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-4">
          Venue rental
        </p>
        <h1 className="font-body font-extrabold text-4xl md:text-5xl text-stone2-900 leading-tight mb-4">
          Host your event
          <br />
          <span className="font-display italic text-bark-500">around the bean.</span>
        </h1>
        <p className="text-stone2-600 text-[15px] leading-relaxed max-w-xl mb-8">
          The café is available for private events outside regular opening hours. Corporate
          breakfasts, product launches, team off-sites, birthday dinners, photo shoots — we handle
          the coffee, you handle the guest list.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="mailto:events@aroundthebean.ca"
            className="inline-flex items-center justify-center px-7 py-3.5 bg-neon-500 hover:bg-neon-600 text-stone2-900 font-bold  text-sm transition-colors"
          >
            Send us an enquiry
          </a>
          <a
            href="tel:+16041234567"
            className="inline-flex items-center justify-center px-7 py-3.5 border-2 border-stone2-900 text-forest-700 hover:bg-forest-50 font-bold  text-sm transition-colors"
          >
            Call us
          </a>
        </div>
      </section>

      {/* Space photo */}
      <section className="max-w-6xl mx-auto px-5 mb-16">
        <div className="aspect-[16/7]  glass glass-edge flex items-center justify-center text-stone2-400 text-sm font-semibold">
          Café interior — event setup photo
        </div>
      </section>

      {/* Packages */}
      <section className="bloom bloom-alt relative overflow-hidden border-y-2 border-stone2-900 py-16 px-5">
        <div className="max-w-6xl mx-auto">
          <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-2">
            Packages
          </p>
          <h2 className="font-body font-extrabold text-3xl text-stone2-900 mb-10">What we offer</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {PACKAGES.map(({ name, time, price, cap, includes, featured }) => (
              <div
                key={name}
                className={` p-6 border transition-all ${featured ? 'bg-neon-600 border-stone2-900 shadow-lg' : 'bg-birch-100 border-birch-200 hover:border-stone2-900'}`}
              >
                {featured && (
                  <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-bark-300 bg-birch-100/10 px-2.5 py-1  mb-4">
                    Most popular
                  </span>
                )}
                <p
                  className={`text-xs font-semibold mb-1 ${featured ? 'text-forest-300' : 'text-stone2-400'}`}
                >
                  {time}
                </p>
                <h3
                  className={`font-bold text-lg mb-1 ${featured ? 'text-stone2-900' : 'text-stone2-900'}`}
                >
                  {name}
                </h3>
                <p
                  className={`text-2xl font-extrabold mb-1 ${featured ? 'text-bark-300' : 'text-bark-500'}`}
                >
                  {price}
                </p>
                <p
                  className={`text-xs mb-6 ${featured ? 'text-stone2-900/50' : 'text-stone2-400'}`}
                >
                  {cap}
                </p>
                <ul className="space-y-2">
                  {includes.map((item) => (
                    <li
                      key={item}
                      className={`text-sm flex items-start gap-2 ${featured ? 'text-stone2-900/80' : 'text-stone2-600'}`}
                    >
                      <span className="text-forest-400 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capacity + details */}
      <section className="max-w-6xl mx-auto px-5 py-16 grid md:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-4">
            The space
          </p>
          <h2 className="font-body font-extrabold text-2xl text-stone2-900 mb-5">Good to know</h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              ['50', 'max capacity'],
              ['34', 'indoor seats'],
              ['16', 'terrace seats'],
              ['3 hrs', 'min booking'],
            ].map(([n, l]) => (
              <div key={l} className="p-4 glass glass-edge">
                <p className="font-extrabold text-2xl text-forest-700">{n}</p>
                <p className="text-xs text-stone2-400 font-medium mt-0.5">{l}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3 text-stone2-600 text-sm leading-relaxed">
            <p>
              Events are available <strong>Monday – Sunday after 7 pm</strong> and before 10 am on
              weekdays.
            </p>
            <p>
              A non-refundable deposit of 30 % is required to hold the date. The remainder is due 7
              days before the event.
            </p>
            <p>We can accommodate most dietary requirements with advance notice.</p>
            <p>Cancellations made with less than 72 hours notice will not be refunded.</p>
          </div>
        </div>
        <div>
          <p className="text-forest-600 text-xs font-bold tracking-[0.2em] uppercase mb-4">
            Enquiry
          </p>
          <h2 className="font-body font-extrabold text-2xl text-stone2-900 mb-5">Get in touch</h2>
          <div className="space-y-4 p-6 glass glass-edge">
            <div>
              <p className="text-xs font-semibold text-stone2-600 mb-1">Email</p>
              <a
                href="mailto:events@aroundthebean.ca"
                className="text-forest-700 font-bold hover:underline"
              >
                events@aroundthebean.ca
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold text-stone2-600 mb-1">Phone</p>
              <a href="tel:+16041234567" className="text-forest-700 font-bold hover:underline">
                +1 (604) 123-4567
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold text-stone2-600 mb-1">Response time</p>
              <p className="text-stone2-900 font-medium text-sm">
                Within 24 hours on business days
              </p>
            </div>
            <hr className="border-birch-200" />
            <p className="text-xs text-stone2-400 leading-relaxed">
              Please include your preferred date, estimated guest count, and a brief description of
              the event.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
