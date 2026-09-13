import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { imageSrc } from '@/lib/api';

/**
 * A product or recipe photo on a card.
 *
 * When the file is gone (a photo uploaded before the server had persistent
 * storage, wiped by a redeploy) it shows a plain "photo missing" plate at the
 * same size, instead of a broken-image icon, so it is obvious what to re-upload.
 */
export function ProductPhoto({ url, className = '' }: { url: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = imageSrc(url);
  if (!src) return null;

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-stone2-200 bg-stone2-900/[0.03] text-[12px] text-stone2-400 ${className}`}
      >
        <ImageOff size={18} />
        Photo missing. Upload it again.
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-lg object-cover ${className}`}
    />
  );
}
