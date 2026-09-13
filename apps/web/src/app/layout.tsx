import type { Metadata, Viewport } from 'next';
import { Hahmlet, JetBrains_Mono, Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Footer } from '@/components/layout/footer';
import { Providers } from '@/providers';

const displayFont = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  style: ['normal', 'italic'],
  display: 'swap',
});

// Hahmlet is a Korean serif drawn with a Latin companion. One typeface that
// already carries both traditions, so the fusion is structural, not decorative.
const sealFont = Hahmlet({
  subsets: ['latin'],
  variable: '--font-seal',
  weight: ['300', '400', '600', '700'],
  display: 'swap',
});

// Structural type. Prices, counts and labels are data, so they get a grid.
const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Around the Bean', template: '%s · Around the Bean' },
  description:
    'A family-owned coffee shop at the edge of campus. Single-origin beans, Korean-inspired drinks, and a warm space rooted in the UBC community.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Around the Bean' },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${sealFont.variable} ${monoFont.variable} ${bodyFont.variable}`}
    >
      <body className="min-h-screen bg-birch-50 text-stone2-900 font-body antialiased">
        <Providers>
          <Header />
          {/* The footer now clears the fixed tab bar on phones, so the page
              content no longer needs its own bottom padding. */}
          <main className="page-bloom relative">{children}</main>
          <Footer />
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
