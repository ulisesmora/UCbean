import Image from 'next/image';

/**
 * Every photographic slot on the site.
 *
 * Until a real file exists it renders a labelled glass plate at the correct
 * aspect ratio, so the layout is already final and dropping the photo in is a
 * one-line change: give the slot a `src`.
 *
 * Photos live in `public/photos/`. See `public/photos/README.md` for the list
 * of slots the site expects and the size each one is served at.
 */
export type PhotoProps = {
  /** Path under /photos, e.g. "interior-morning.jpg". Omit while unshot. */
  src?: string;
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
