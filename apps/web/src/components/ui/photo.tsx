import Image from 'next/image';

/**
 * Every photographic slot on the site.
 *
 * Until a real file exists it renders a labelled glass plate at the correct
 * aspect ratio, so the layout is already final and dropping the photo in is a
 * one-line change: give the slot a `src`.
 *
 * Two kinds of source:
 *   - a file name under `public/photos/`, e.g. "interior-morning.jpg"
 *   - a full URL, e.g. a product photo uploaded from the counter app, which
 *     lives on the API's image CDN
 */
export type PhotoProps = {
  /** File under /photos, or a full URL. Omit while unshot. */
  src?: string | null;
  /** Describes the photo for screen readers. Required once src is set. */
  alt: string;
  /** Shown on the placeholder so the slot is identifiable in the layout. */
  label: string;
  /** Tailwind aspect class, e.g. "aspect-[4/5]". */
  className?: string;
  /** Widths this slot occupies, for responsive loading. */
  sizes?: string;
  /** True for anything above the fold, so it is not lazy-loaded. */
  priority?: boolean;
};

/** Si es una dirección completa y no un nombre de fichero de /photos. */
const esUrl = (src: string) => /^(https?:)?\/\//.test(src) || src.startsWith('/');

export function Photo({
  src,
  alt,
  label,
  className = '',
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
}: PhotoProps) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={`Placeholder: ${label}`}
        className={`glass glass-edge flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.18em] text-stone2-400 ${className}`}
      >
        {label}
      </div>
    );
  }

  // Las fotos subidas desde el CRM ya salen del CDN de la API optimizadas a
  // WebP y con nombre por contenido. Pasarlas por next/image obligaría a
  // declarar el host y a volver a optimizar algo que ya está optimizado.
  // Antes esta rama no existía: se anteponía /photos/ a todo y una foto
  // subida acababa en /photos//uploads/..., rota.
  if (esUrl(src)) {
    return (
      <div className={`glass glass-edge relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ya optimizada en el CDN de la API */}
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`glass glass-edge relative overflow-hidden ${className}`}>
      <Image
        src={`/photos/${src}`}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
