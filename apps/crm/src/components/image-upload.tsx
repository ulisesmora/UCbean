import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { Eyebrow } from '@/components/ui';

// Same rule as lib/api.ts: blank counts as unset, production falls back to Railway.
const BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://ucbean-production.up.railway.app/api/v1' : '/api/v1');

export interface Uploaded {
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Sube una foto de producto.
 *
 * El archivo va al backend, que lo reduce, lo pasa a WebP y devuelve una
 * URL con nombre de contenido. Aquí no se comprime nada: hacerlo en el
 * navegador significaría una foto distinta por navegador, y el servidor
 * tendría que aceptar lo que llegue igualmente.
 *
 * La vista previa sale del archivo local antes de que termine la subida,
 * para que se vea que pasó algo al soltar la foto.
 */
export function ImageUpload({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
}) {
  const token = useAuth((s) => s.token);
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function subir(file: File) {
    setError(null);
    setSubiendo(true);
    setPreview(URL.createObjectURL(file));

    try {
      const body = new FormData();
      body.append('file', file);

      // Sin Content-Type a mano: el navegador tiene que poner el suyo con
      // el separador del multipart, y fijarlo rompe la subida entera.
      const res = await fetch(`${BASE}/uploads/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
        body,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `Error ${res.status}`);

      const subida: Uploaded = json.data ?? json;
      onChange(subida.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      setPreview(null);
    } finally {
      setSubiendo(false);
    }
  }

  const mostrada = preview ?? value;

  return (
    <div className="flex flex-col gap-2">
      <Eyebrow>Photo</Eyebrow>

      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={subiendo}
          className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-xl border border-stone2-200 bg-white/60 transition-colors hover:bg-stone2-900/5 disabled:opacity-60"
        >
          {mostrada ? (
            <img src={mostrada} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-stone2-400">
              <ImagePlus size={20} />
              <span className="text-[11px]">Upload</span>
            </span>
          )}

          {subiendo && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <Loader2 size={18} className="animate-spin text-stone2-600" />
            </span>
          )}
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="text-[12.5px] leading-snug text-stone2-400">
            JPG, PNG or WebP up to 5 MB. It is resized and converted automatically, so you can
            upload the photo straight from your phone.
          </p>

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setPreview(null);
              }}
              className="btn btn-quiet self-start px-2.5 py-1 text-[12.5px] text-bark-700"
            >
              <X size={13} />
              Remove photo
            </button>
          )}

          {error && <p className="text-[12.5px] text-bark-700">{error}</p>}
        </div>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) subir(file);
          // Se limpia para que elegir el mismo archivo otra vez vuelva a
          // disparar el evento.
          e.target.value = '';
        }}
      />
    </div>
  );
}
