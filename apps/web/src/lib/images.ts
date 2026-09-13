const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

/** El origen del API, sin el `/api/v1`: de ahí cuelga el CDN de imágenes. */
const ORIGIN = BASE.replace(/\/api\/v\d+\/?$/, '');

/**
 * De la url que guarda el producto a una que el navegador pueda pedir.
 *
 * Las fotos subidas desde el CRM se guardan como `/uploads/…`, una ruta del
 * servidor del API, no de la web. Las de fuera vienen ya absolutas y se
 * devuelven tal cual.
 */
export function imageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return `${ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * The stand-in photo while a product has none of its own: a file under
 * `public/photos`. By name first, then by menu section, then by what the name
 * itself says ("Iced…"), which is all an old order line has to go on.
 */
const BY_NAME: Record<string, string> = {
  'Pour Over': 'espresso-pull.jpg',
  Cortado: 'coffee-bar.jpg',
  'Flat White': 'coffee-bar.jpg',
  Americano: 'menu-board.jpg',
  'Cold Brew': 'terrace.jpg',
  'Batch Brew': 'morning-rush.jpg',
  'Build your own': 'espresso-pull.jpg',
};

export function fallbackPhoto(name: string, category?: string | null): string {
  if (BY_NAME[name]) return BY_NAME[name];
  const text = `${category ?? ''} ${name}`;
  if (/bean/i.test(text)) return 'bean-shelf.jpg';
  if (/iced|cold/i.test(text)) return 'terrace.jpg';
  if (/filter/i.test(text)) return 'espresso-pull.jpg';
  if (/pastr|food|croissant|cookie|muffin/i.test(text)) return 'corner-table.jpg';
  return 'coffee-bar.jpg';
}

/**
 * A product's photo, ready for an <img>.
 *
 * The one uploaded from the counter app when there is one, otherwise the same
 * stand-in the menu shows. The bag, the order history and the home strip all
 * go through here, so a coffee never has a photo on /menu and a blank square
 * in the bag. That blank square was the bug: only /menu knew the stand-ins.
 */
export function productImage(p: {
  name: string;
  imageUrl?: string | null;
  category?: { name: string } | null;
}): string {
  return imageSrc(p.imageUrl) ?? `/photos/${fallbackPhoto(p.name, p.category?.name)}`;
}
