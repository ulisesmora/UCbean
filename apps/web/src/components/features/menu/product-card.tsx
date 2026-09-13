'use client';

import { useState } from 'react';
import { Plus, Sliders } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/api.types';
import { cn } from '@/lib/utils';
import { fallbackPhoto, imageSrc } from '@/lib/images';
import { Photo } from '@/components/ui/photo';
import { CustomiseSheet } from './customise-sheet';
import { BUILD_OWN } from './build-your-own-card';

interface Props {
  product: Product;
  /** Tamaños para la carga responsive. La portada y /menu no ocupan lo mismo. */
  sizes?: string;
}

/**
 * La tarjeta de un producto. La misma en /menu y en la portada.
 *
 * Una sola pieza para las dos a propósito: si la portada tuviera su propia
 * tarjeta, el precio, la foto o el botón de añadir acabarían diferentes en
 * cuanto alguien tocara uno y no el otro.
 */
export function ProductCard({ product, sizes }: Props) {
  // Añadir ya no es un toque a ciegas: abre el «¿algo más?», que es lo que
  // pasa en la barra y lo que se saltaba la web.
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();
  // Build your own is not picked off a shelf: it opens the configurator.
  const configurable = BUILD_OWN.test(product.name);

  return (
    <>
      <div className="glass glass-edge glass-hover group flex h-full flex-col p-5 transition-transform duration-300 hover:scale-[1.015]">
        <Photo
          src={imageSrc(product.imageUrl) ?? fallbackPhoto(product.name, product.category?.name)}
          label={product.name}
          alt={`${product.name} at the bar`}
          className="mb-5 aspect-square w-full"
          sizes={sizes ?? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw'}
        />

        <div className="mb-1.5 flex items-start justify-between gap-3">
          <p className="font-seal text-[17px] leading-snug text-stone2-900">{product.name}</p>
          <p className="shrink-0 font-mono text-[15px] font-bold tabular-nums text-stone2-900">
            ${Number(product.price).toFixed(2)}
          </p>
        </div>

        {product.description && (
          <p className="mb-5 flex-1 font-mono text-[11px] leading-relaxed text-stone2-400">
            {product.description}
          </p>
        )}

        <button
          onClick={() => (configurable ? router.push('/build') : setAbierto(true))}
          disabled={!product.isAvailable}
          className={cn(
            'btn mt-auto w-full py-2.5 text-[13px]',
            product.isAvailable ? 'btn-acid' : 'cursor-not-allowed bg-birch-100 text-stone2-400',
          )}
        >
          {!product.isAvailable ? (
            'Unavailable'
          ) : (
            <>
              {configurable ? <Sliders size={13} /> : <Plus size={13} />}
              {configurable ? 'Start building' : 'Add to order'}
            </>
          )}
        </button>
      </div>

      <CustomiseSheet product={abierto ? product : null} open={abierto} onOpenChange={setAbierto} />
    </>
  );
}
