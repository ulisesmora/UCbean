import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { Download, Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, Chip, Empty, ErrorBox, Eyebrow, Field, PageHead, Spinner } from '@/components/ui';

/** The customer website. Every QR points to its /app page. */
const WEB_URL = (import.meta.env.VITE_WEB_URL || 'https://u-cbean-web.vercel.app').replace(
  /\/$/,
  '',
);

/**
 * Where a QR is going to live, and what it says there.
 *
 * The headline sells the benefit for that spot, never "download our app":
 * at the counter the benefit is skipping the line, on a cup it is the ping.
 */
const PLACEMENTS = [
  { source: 'qr-counter', label: 'Counter', headline: 'Order ahead. Skip the line.' },
  { source: 'qr-table', label: 'Tables', headline: 'Your usual, one tap away.' },
  { source: 'qr-cup', label: 'Cup sleeve', headline: "We'll ping you when it's ready." },
  { source: 'qr-receipt', label: 'Receipt', headline: '+50 points in the app.' },
];

/** Same rule the API checks: letters, digits and dashes, 40 at most. */
const slug = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

function download(href: string, name: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.click();
}

/**
 * QR codes for the app.
 *
 * Each placement gets its own code (`/app?src=qr-counter`), so the table
 * below tells which spot actually brings installs. Print makes a poster;
 * the downloads are for a printer or a designer.
 */
export function AppQrPage() {
  const [source, setSource] = useState(PLACEMENTS[0].source);
  const [headline, setHeadline] = useState(PLACEMENTS[0].headline);
  const [svg, setSvg] = useState('');
  const url = `${WEB_URL}/app?src=${source || 'qr'}`;

  const installs = useQuery({
    queryKey: ['crm', 'app-installs'],
    queryFn: () => api.get<{ source: string; installs: number }[]>('/loyalty/app-installs'),
  });

  useEffect(() => {
    let vigente = true;
    QRCode.toString(url, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0A0A0A', light: '#FFFFFF' },
    })
      .then((s) => vigente && setSvg(s))
      .catch(() => vigente && setSvg(''));
    return () => {
      vigente = false;
    };
  }, [url]);

  const pick = (p: (typeof PLACEMENTS)[number]) => {
    setSource(p.source);
    setHeadline(p.headline);
  };

  return (
    <>
      {/* Printing shows only the poster, centred on the page. */}
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #qr-poster, #qr-poster * { visibility: visible !important; }
        #qr-poster { position: fixed; inset: 0; margin: auto; width: 150mm; height: fit-content; box-shadow: none !important; }
      }`}</style>

      <PageHead eyebrow="Marketing" title="App QR codes">
        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-olive tap-target px-4 py-2 text-[14px]"
        >
          <Printer size={15} />
          Print poster
        </button>
      </PageHead>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Card>
            <Eyebrow>Where it goes</Eyebrow>
            <div className="mt-3 flex flex-wrap gap-2">
              {PLACEMENTS.map((p) => (
                <button
                  key={p.source}
                  type="button"
                  aria-pressed={source === p.source}
                  onClick={() => pick(p)}
                  className={`btn tap-target px-3.5 py-2 text-[13px] ${source === p.source ? 'btn-olive' : 'btn-quiet'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3">
              <Field
                name="qr-source"
                label="Tracking name"
                hint="Letters, numbers and dashes. It names this QR in the installs list."
                value={source}
                onChange={(e) => setSource(slug(e.target.value))}
                placeholder="qr-window"
              />
              <Field
                name="qr-headline"
                label="Headline on the poster"
                value={headline}
                maxLength={48}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>
            <p className="mt-3 break-all font-mono text-[12px] text-stone2-400">{url}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!svg}
                onClick={() =>
                  download(
                    URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })),
                    `around-the-bean-${source}.svg`,
                  )
                }
                className="btn btn-quiet tap-target px-3.5 py-2 text-[13px]"
              >
                <Download size={14} />
                SVG
              </button>
              <button
                type="button"
                onClick={() =>
                  QRCode.toDataURL(url, { width: 1200, margin: 2, errorCorrectionLevel: 'M' }).then(
                    (d) => download(d, `around-the-bean-${source}.png`),
                  )
                }
                className="btn btn-quiet tap-target px-3.5 py-2 text-[13px]"
              >
                <Download size={14} />
                PNG
              </button>
            </div>
          </Card>

          <Card>
            <Eyebrow>Installs by QR</Eyebrow>
            <p className="mt-1 text-[13px] text-stone2-400">
              Counted when someone signed in opens the app from their home screen for the first
              time.
            </p>
            <div className="mt-3">
              {installs.isLoading ? (
                <Spinner label="Loading installs" />
              ) : installs.error ? (
                <ErrorBox error={installs.error} onRetry={() => installs.refetch()} />
              ) : !installs.data?.length ? (
                <Empty
                  title="No installs yet"
                  hint="Print a code, put it on the counter, and the count starts here."
                />
              ) : (
                <ul className="flex flex-col divide-y divide-stone2-900/10">
                  {installs.data.map((r) => (
                    <li
                      key={r.source}
                      className="flex items-center justify-between py-2.5 text-[14px]"
                    >
                      <Chip tone={r.source.startsWith('qr-') ? 'olive' : 'neutral'}>
                        {r.source}
                      </Chip>
                      <span className="font-bold tabular-nums text-stone2-900">{r.installs}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        <div
          id="qr-poster"
          className="mx-auto flex w-full max-w-[420px] flex-col items-center rounded-[8px] border-2 border-stone2-900 bg-white p-8 text-center shadow-[5px_5px_0_#A9C23F]"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-stone2-900">
            Around the Bean
          </p>
          <h2 className="mt-3 text-balance text-[2rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-stone2-900">
            {headline || 'Get the app'}
          </h2>
          {svg ? (
            <div
              role="img"
              aria-label={`QR code for ${url}`}
              className="mt-6 w-full max-w-[260px] rounded-[6px] border-2 border-stone2-900 p-2 [&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="mt-6 aspect-square w-full max-w-[260px] animate-pulse rounded-[6px] bg-stone2-900/5" />
          )}
          <p className="mt-5 text-[15px] font-semibold text-stone2-900">
            Scan with your phone camera
          </p>
          <p className="mt-1 text-[13px] text-stone2-600">
            Add it to your home screen. +50 points the first time you open it.
          </p>
        </div>
      </div>
    </>
  );
}
