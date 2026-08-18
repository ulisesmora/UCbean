import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Providers } from '@/providers';

const displayFont = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  style: ['normal', 'italic'],
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
  themeColor: '#f7f3ed',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen bg-birch-50 text-stone2-900 font-body antialiased">
        <Providers>
          <Header />
          <main className="pb-20 md:pb-0">{children}</main>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
