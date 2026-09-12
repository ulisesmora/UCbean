import Link from 'next/link';
import type { Metadata } from 'next';
import { SeasonalShowcase } from '@/components/features/seasonal/seasonal-showcase';
import { CoffeeBuilder } from '@/components/features/builder/coffee-builder';
import { Photo } from '@/components/ui/photo';

export const metadata: Metadata = {
  title: 'Around the Bean — Coffee rooted in the forest',
};

/* Section marker. Brutalism labels its own structure instead of hiding it. */
function Marker({ label }: { label: string }) {
  return (
    <p className="mb-5 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-stone2-600">
      <span className="h-2.5 w-2.5 bg-neon-500 ring-1 ring-stone2-900" />
      {label}
    </p>
  );
}

/* ── Ticker ──────────────────────────────────────────────── */
function Ticker() {
  const items = [
    'Around the Bean',
    'UBC Vancouver',
    'Est. 2018',
    'Family owned',
    'Open daily 7am – 7pm',
    'Order & reserve online',
    'Around the Bean',
    'UBC Vancouver',
    'Est. 2018',
    'Family owned',
    'Open daily 7am – 7pm',
    'Order & reserve online',
  ];
  return (
    <div className="select-none overflow-hidden border-y-2 border-stone2-900 bg-neon-500 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-stone2-900">
      <div className="ticker-track">
        {items.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
        {items.map((t, i) => (
          <span key={`d${i}`}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="bloom blueprint relative overflow-hidden border-b-2 border-stone2-900">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-16 md:grid-cols-2 md:gap-16 md:pb-28 md:pt-24">
        <div className="animate-rise">
          <div className="glass glass-edge mb-8 inline-flex items-center gap-2.5 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-stone2-900">
            <span className="h-2 w-2 bg-neon-500 ring-1 ring-stone2-900" />
            Open now · University Campus, Vancouver
          </div>

          <h1 className="mb-7 text-[3rem] font-extrabold leading-[0.95] text-stone2-900 sm:text-6xl md:text-[4.5rem]">
            Coffee rooted
            <br />
            in the <span className="marker font-seal italic">forest.</span>
          </h1>

          <p className="mb-10 max-w-md text-[16px] leading-relaxed text-stone2-600">
            A small, family-run café at the edge of campus. Single-origin beans, brewed with care,
            in a room that feels like the Pacific Northwest.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/pickup" className="btn btn-acid px-8 py-4 text-[15px]">
              Order for pickup
            </Link>
            <Link href="/table" className="btn px-8 py-4 text-[15px]">
              Reserve a table
            </Link>
          </div>

          {/* Hours, as a spec table */}
          <div className="glass glass-edge mt-10 grid max-w-sm grid-cols-2 font-mono text-xs">
            <div className="border-r-2 border-stone2-900 p-3.5">
              <p className="mb-1 uppercase tracking-[0.18em] text-stone2-400">Mon – Fri</p>
              <p className="text-[15px] font-bold tabular-nums text-stone2-900">07:00 — 19:00</p>
            </div>
            <div className="p-3.5">
              <p className="mb-1 uppercase tracking-[0.18em] text-stone2-400">Sat – Sun</p>
              <p className="text-[15px] font-bold tabular-nums text-stone2-900">08:00 — 18:00</p>
            </div>
          </div>
        </div>

        <div className="relative hidden md:block">
          <Photo
            src="interior-hero.jpg"
            label="Café interior"
            alt="Espresso bar under pendant lights, with a chalkboard menu on the brick wall"
            className="aspect-[4/5]"
            sizes="(max-width: 768px) 100vw, 45vw"
            priority
          />
          <div className="glass glass-edge absolute -bottom-8 -left-8 w-56 p-5">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-stone2-400">
              Today
            </p>
            <p className="font-seal text-xl text-stone2-900">Yuzu Americano</p>
            <p className="mt-1 font-mono text-[13px] font-bold text-bark-700">
              Korean citrus · $5.50
            </p>
          </div>
          <div className="glass glass-edge absolute -right-5 -top-5 flex h-20 w-20 items-center justify-center">
            <p className="text-center font-mono text-[10px] font-bold uppercase leading-tight tracking-widest">
              Est.
              <br />
              2018
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Quick actions ───────────────────────────────────────── */
function QuickActions() {
  const items = [
    { href: '/pickup', n: '01', label: 'Order & pickup', sub: 'Ready in about 10 minutes' },
    { href: '/table', n: '02', label: 'Reserve a table', sub: 'Book your spot' },
    { href: '/events', n: '03', label: 'Rent the space', sub: 'Events and gatherings' },
    { href: '/menu', n: '04', label: 'Full menu', sub: 'Hot, iced and whole bean' },
  ];
  return (
    <section className="bloom bloom-alt relative overflow-hidden border-b-2 border-stone2-900">
      <div className="mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4">
        {items.map(({ href, n, label, sub }, i) => (
          <Link
            key={href}
            href={href}
            className={`group p-6 transition-colors hover:bg-neon-500 ${
              i < 3 ? 'border-r-2 border-stone2-900' : ''
            } ${i < 2 ? 'border-b-2 border-stone2-900 md:border-b-0' : ''}`}
          >
            <span className="mb-4 block font-mono text-[11px] font-bold tracking-widest text-stone2-400 group-hover:text-stone2-900">
              [{n}]
            </span>
            <p className="font-seal text-lg leading-snug text-stone2-900">{label}</p>
            <p className="mt-1.5 font-mono text-[11px] text-stone2-400 group-hover:text-stone2-900">
              {sub}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── About the space ─────────────────────────────────────── */
function AboutSpace() {
  return (
    <section className="bloom bloom-alt relative overflow-hidden border-b-2 border-stone2-900">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 md:grid-cols-2 md:gap-20 md:py-28">
        <div className="grid grid-cols-2 gap-4">
          <Photo
            src="interior.jpg"
            label="Interior"
            alt="The main café floor seen from the entrance"
            className="col-span-1 aspect-[3/4]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <div className="col-span-1 grid gap-4">
            <Photo
              src="coffee-bar.jpg"
              label="Coffee bar"
              alt="The espresso bar along the wood counter"
              className="aspect-square"
              sizes="(max-width: 768px) 50vw, 22vw"
            />
            <Photo
              src="corner-table.jpg"
              label="Corner table"
              alt="A small table in the quiet corner"
              className="aspect-square"
              sizes="(max-width: 768px) 50vw, 22vw"
            />
          </div>
          <Photo
            src="terrace.jpg"
            label="Terrace"
            alt="Terrace seating in the morning light"
            className="col-span-2 aspect-video"
            sizes="(max-width: 768px) 100vw, 45vw"
          />
        </div>

        <div>
          <Marker label="The space" />
          <h2 className="mb-7 text-4xl font-extrabold leading-[1.0] text-stone2-900 md:text-5xl">
            A room that feels like
            <br />
            <span className="font-seal italic">the woods.</span>
          </h2>

          <div className="space-y-5 text-[16px] leading-relaxed text-stone2-600">
            <p>
              The café occupies a heritage building on the south edge of campus. Exposed Douglas fir
              beams, a long wood counter, and floor-to-ceiling windows that fill the room with
              Pacific Northwest light every morning.
            </p>
            <p>
              Thirty-four seats across two zones, plus sixteen more on the terrace when the weather
              allows. No loud music. No rush. Laptops welcome.
            </p>
          </div>

          <div className="glass glass-edge mt-10 grid grid-cols-3">
            {[
              ['34', 'indoor seats'],
              ['16', 'terrace seats'],
              ['07', 'opens daily'],
            ].map(([n, l], i) => (
              <div key={l} className={`p-5 ${i < 2 ? 'border-r-2 border-stone2-900' : ''}`}>
                <p className="font-mono text-3xl font-bold tabular-nums text-stone2-900">{n}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-stone2-400">
                  {l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Menu preview ────────────────────────────────────────── */
const DRINKS = [
  { name: 'Pour Over', price: '6.50', notes: 'Floral, bergamot, honey', cat: 'Filter' },
  { name: 'Yuzu Americano', price: '5.50', notes: 'Korean citrus, bright, bold', cat: 'Iced' },
  { name: 'Cortado', price: '4.50', notes: 'Espresso, equal warm milk', cat: 'Espresso' },
  { name: 'Hojicha Latte', price: '5.50', notes: 'Roasted green tea, oat milk', cat: 'Hot' },
];

function MenuPreview() {
  return (
    <section className="bloom relative overflow-hidden border-b-2 border-stone2-900 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Marker label="What we brew" />
        <div className="mb-10 flex items-end justify-between gap-6">
          <h2 className="text-4xl font-extrabold text-stone2-900 md:text-5xl">The menu</h2>
          <Link
            href="/menu"
            className="shrink-0 border-b-2 border-stone2-900 pb-0.5 text-[15px] font-semibold text-stone2-900 transition-colors hover:bg-neon-500"
          >
            See all →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DRINKS.map(({ name, price, notes, cat }) => (
            <div key={name} className="glass glass-edge glass-hover p-5">
              <div className="rule-thin mb-5 flex aspect-square items-center justify-center bg-birch-100 font-mono text-[10px] uppercase tracking-[0.2em] text-stone2-400">
                {cat}
              </div>
              <div className="flex items-start justify-between gap-3">
                <p className="font-seal text-[17px] leading-snug text-stone2-900">{name}</p>
                <p className="shrink-0 font-mono text-[15px] font-bold tabular-nums text-stone2-900">
                  ${price}
                </p>
              </div>
              <p className="mt-1.5 font-mono text-[11px] leading-snug text-stone2-400">{notes}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Gallery ─────────────────────────────────────────────── */
function Gallery() {
  const photos: { file: string; label: string; alt: string }[] = [
    {
      file: 'morning-rush.jpg',
      label: 'Morning rush',
      alt: 'Customers at the counter during the morning rush',
    },
    {
      file: 'espresso-pull.jpg',
      label: 'Espresso pull',
      alt: 'A barista pulling a shot of espresso',
    },
    {
      file: 'menu-board.jpg',
      label: 'Menu board',
      alt: 'The handwritten menu board above the bar',
    },
    { file: 'terrace-wide.jpg', label: 'Terrace', alt: 'The terrace tables seen from outside' },
    { file: 'armchairs.jpg', label: 'Corner armchairs', alt: 'Armchairs in the reading corner' },
    { file: 'bean-shelf.jpg', label: 'Bean shelf', alt: 'Bags of whole beans on the retail shelf' },
  ];
  return (
    <section className="bloom bloom-alt relative overflow-hidden border-b-2 border-stone2-900 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Marker label="The atmosphere" />
        <h2 className="mb-10 text-4xl font-extrabold text-stone2-900 md:text-5xl">Come see us</h2>

        <div className="grid grid-cols-2 gap-4 md:hidden">
          {photos.map((p) => (
            <Photo
              key={p.file}
              src={p.file}
              label={p.label}
              alt={p.alt}
              className="aspect-square"
              sizes="50vw"
            />
          ))}
        </div>

        <div className="hidden auto-rows-[190px] grid-cols-4 gap-4 md:grid">
          <Photo
            src={photos[0].file}
            label={photos[0].label}
            alt={photos[0].alt}
            className="col-span-2 row-span-2"
            sizes="45vw"
          />
          <Photo src={photos[1].file} label={photos[1].label} alt={photos[1].alt} sizes="22vw" />
          <Photo src={photos[2].file} label={photos[2].label} alt={photos[2].alt} sizes="22vw" />
          <Photo src={photos[3].file} label={photos[3].label} alt={photos[3].alt} sizes="22vw" />
          <Photo src={photos[4].file} label={photos[4].label} alt={photos[4].alt} sizes="22vw" />
          <Photo
            src={photos[5].file}
            label={photos[5].label}
            alt={photos[5].alt}
            className="col-span-4"
            sizes="90vw"
          />
        </div>
      </div>
    </section>
  );
}

/* ── Events ──────────────────────────────────────────────── */
function Events() {
  const perks = [
    {
      n: '01',
      title: 'Private buy-out',
      body: 'Reserve the full café for your event, fifty people, exclusive access to the space and the bar.',
    },
    {
      n: '02',
      title: 'Full drink service',
      body: 'Our baristas stay on for the duration. A custom drink menu is available for groups.',
    },
    {
      n: '03',
      title: 'Bring your own food',
      body: 'We do not cater, but you are welcome to bring catering in. Tables and service included.',
    },
  ];
  return (
    <section className="bloom blueprint relative overflow-hidden border-b-2 border-stone2-900 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Marker label="Rent the space" />
        <h2 className="mb-10 text-4xl font-extrabold text-stone2-900 md:text-5xl">
          Hold it <span className="marker marker-ember font-seal italic">here.</span>
        </h2>

        <div className="grid gap-5 md:grid-cols-3">
          {perks.map(({ n, title, body }) => (
            <div key={title} className="glass glass-edge p-7">
              <p className="mb-4 font-mono text-[11px] font-bold tracking-widest text-stone2-400">
                [{n}]
              </p>
              <p className="mb-3 font-seal text-xl text-stone2-900">{title}</p>
              <p className="text-[15px] leading-relaxed text-stone2-600">{body}</p>
            </div>
          ))}
        </div>

        <Link href="/events" className="btn btn-acid mt-10 px-7 py-3.5 text-[15px]">
          Enquire about the space →
        </Link>
      </div>
    </section>
  );
}

/* ── Family story ────────────────────────────────────────── */
function FamilyStory() {
  return (
    <section className="bloom bloom-alt relative overflow-hidden border-b-2 border-stone2-900 px-6 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2 md:gap-20">
        <div>
          <Marker label="The family" />
          <h2 className="mb-7 text-4xl font-extrabold leading-[1.0] text-stone2-900 md:text-5xl">
            Run by the people
            <br />
            <span className="font-seal italic">who pull the shots.</span>
          </h2>
          <div className="space-y-5 text-[16px] leading-relaxed text-stone2-600">
            <p>
              Around the Bean opened in 2018. Two parents and a daughter who wanted to bring their
              love of specialty coffee to the neighbourhood they were already part of.
            </p>
            <p>
              We still roast in small batches, still know most of our regulars by name, and still
              close early on the days the whole family needs to be somewhere else.
            </p>
          </div>
        </div>
        <Photo
          src="family.jpg"
          label="The counter nook"
          alt="A cup and a pastry on the window counter, under trailing plants"
          className="aspect-[4/3]"
          sizes="(max-width: 768px) 100vw, 45vw"
        />
      </div>
    </section>
  );
}

/* ── Closing CTA ─────────────────────────────────────────── */
function TableCTA() {
  return (
    <section className="border-t-2 border-stone2-900 bg-neon-500 px-6 py-24 text-center md:py-32">
      <div className="mx-auto max-w-2xl">
        <p className="mb-6 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-stone2-900">
          Reserve
        </p>
        <h2 className="mb-7 text-5xl font-extrabold leading-[0.95] text-stone2-900 md:text-6xl">
          Save your <span className="font-seal italic">seat.</span>
        </h2>
        <p className="mx-auto mb-11 max-w-md text-[16px] leading-relaxed text-stone2-900/75">
          Book a table, order ahead, or just walk in. We are open every day of the week.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/table" className="btn px-9 py-4 text-[15px]">
            Reserve a table
          </Link>
          <Link href="/pickup" className="btn btn-ink px-9 py-4 text-[15px]">
            Order for pickup
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Ticker />
      <Hero />
      <QuickActions />
      <CoffeeBuilder />
      <SeasonalShowcase />
      <AboutSpace />
      <MenuPreview />
      <Gallery />
      <Events />
      <FamilyStory />
      <TableCTA />
    </>
  );
}
