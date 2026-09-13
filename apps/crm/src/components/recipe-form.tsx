import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { Eyebrow, Field, Spinner } from '@/components/ui';
import { ImageUpload } from '@/components/image-upload';

export interface DrinkBuild {
  beans: string;
  size: string;
  base: string;
  serve: string;
  milk: string;
  foam: string;
  art: string;
  extras: string[];
  vessel: string;
  sleeve: string;
}

interface Option {
  id: string;
  name: string;
  note: string;
  price: number;
}

interface Catalogue {
  beans: Option[];
  sizes: Option[];
  bases: Option[];
  serves: Option[];
  milks: Option[];
  foams: Option[];
  arts: Option[];
  extras: Option[];
  vessels: Option[];
  sleeves: Option[];
}

export interface RecipeDraft {
  id?: string;
  slug: string;
  name: string;
  accent?: string | null;
  kind: 'SIGNATURE' | 'SEASONAL';
  note: string;
  season?: string | null;
  /** La ventana en la que se publica sola. Solo para las de temporada. */
  activeFrom?: string | null;
  activeTo?: string | null;
  isActive?: boolean;
  build: DrinkBuild;
  /** The menu section it is sold under. Blank uses Signature or Seasonal Drinks. */
  categoryId?: string | null;
  /** Photo on its menu card. */
  imageUrl?: string | null;
}

/** La fecha como la quiere un <input type="date">: solo el día. */
function soloFecha(iso?: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : '';
}

const VACIA: DrinkBuild = {
  beans: 'house',
  size: 'medium',
  base: 'latte',
  serve: 'hot',
  milk: 'whole',
  foam: 'micro',
  art: 'none',
  extras: [],
  vessel: 'togo',
  sleeve: 'kraft',
};

/** El nombre convertido en slug, para no obligar a teclearlo dos veces. */
const aSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Crear y editar una receta.
 *
 * Las opciones salen de `/drinks/options`, que es el mismo catálogo con el
 * que el servidor cobra. Así una bebida nueva no puede usar un ingrediente
 * que no existe, y añadir uno en el backend lo hace aparecer aquí solo.
 *
 * El precio no se teclea: se consulta al servidor mientras se elige. Es la
 * misma cifra que se cobrará, no una estimación del navegador.
 */
export function RecipeForm({
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: RecipeDraft;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (draft: Omit<RecipeDraft, 'id'>) => void;
}) {
  const [build, setBuild] = useState<DrinkBuild>(initial?.build ?? VACIA);
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [kind, setKind] = useState<'SIGNATURE' | 'SEASONAL'>(initial?.kind ?? 'SIGNATURE');
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);

  const categorias = useQuery({
    queryKey: ['crm', 'categories'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/products/categories'),
  });

  const opciones = useQuery({
    queryKey: ['drinks', 'options'],
    queryFn: () => api.get<Catalogue>('/drinks/options'),
    staleTime: 10 * 60_000,
  });

  // El precio y el ticket los calcula el servidor con las mismas reglas
  // que usa para cobrar, así que lo que se ve aquí es lo que se cobrará.
  const precio = useQuery({
    queryKey: ['drinks', 'price', build],
    queryFn: () =>
      api.post<{ price: number; ticket: string; takesFoam: boolean; takesArt: boolean }>(
        '/drinks/price',
        build,
      ),
  });

  if (opciones.isLoading) return <Spinner label="Loading ingredients" />;
  const cat = opciones.data;
  if (!cat) return null;

  const set = (k: keyof DrinkBuild, v: string) => setBuild({ ...build, [k]: v });

  const alternarExtra = (id: string) =>
    setBuild({
      ...build,
      extras: build.extras.includes(id)
        ? build.extras.filter((e) => e !== id)
        : [...build.extras, id],
    });

  return (
    <form
      className="mt-4 flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSubmit({
          slug: slug || aSlug(name),
          name,
          kind,
          note: String(f.get('note')),
          accent: String(f.get('accent')) || null,
          season: kind === 'SEASONAL' ? String(f.get('season')) || null : null,
          // Las fechas solo tienen sentido en una de temporada; en una de
          // siempre se limpian para que no la apaguen sin querer.
          activeFrom: kind === 'SEASONAL' ? String(f.get('activeFrom')) || null : null,
          activeTo: kind === 'SEASONAL' ? String(f.get('activeTo')) || null : null,
          build,
          categoryId: String(f.get('categoryId') ?? '') || null,
          // Null on purpose, so removing a photo reaches the server.
          imageUrl: imageUrl ?? null,
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-[12.5px] font-semibold text-stone2-600">
            Name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              // Solo se autocompleta mientras nadie lo haya tocado: en una
              // receta que ya existe, el slug viaja dentro de pedidos
              // antiguos y cambiarlo los dejaría sin receta.
              if (!initial) setSlug(aSlug(e.target.value));
            }}
            className="field tap-target"
            placeholder="Hojicha Latte"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="slug" className="text-[12.5px] font-semibold text-stone2-600">
            Identifier
          </label>
          <input
            id="slug"
            required
            value={slug}
            onChange={(e) => setSlug(aSlug(e.target.value))}
            disabled={Boolean(initial)}
            className="field tap-target font-mono text-[13px] disabled:opacity-50"
          />
          <span className="text-[11.5px] text-stone2-400">
            {initial ? 'Cannot change: it is stored in past orders' : 'Fills itself in'}
          </span>
        </div>
      </div>

      <Field
        name="note"
        label="How it reads on the menu"
        required
        defaultValue={initial?.note}
        placeholder="Roasted green tea and steamed oat milk"
      />

      {/* Every recipe is also sold as a product: this is its photo and the
          section of the menu it appears in. Its price is the formula's. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-stone2-600">Photo on the menu</span>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="categoryId" className="text-[12.5px] font-semibold text-stone2-600">
            Menu section
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={initial?.categoryId ?? ''}
            className="field tap-target"
          >
            <option value="">
              {kind === 'SEASONAL' ? 'Seasonal Drinks' : 'Signature Drinks'} (default)
            </option>
            {(categorias.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="text-[11.5px] text-stone2-400">
            Sold on the website in this section, at the price below. Customers can add it to their
            bag and order it again as a usual.
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="kind" className="text-[12.5px] font-semibold text-stone2-600">
            Type
          </label>
          <select
            id="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as 'SIGNATURE' | 'SEASONAL')}
            className="field tap-target"
          >
            <option value="SIGNATURE">Signature</option>
            <option value="SEASONAL">Seasonal</option>
          </select>
        </div>

        <Field
          name="accent"
          label="Original name"
          defaultValue={initial?.accent ?? ''}
          placeholder="ほうじ茶"
        />

        {kind === 'SEASONAL' && (
          <Field
            name="season"
            label="Season"
            defaultValue={initial?.season ?? ''}
            placeholder="Autumn"
          />
        )}
      </div>

      {/* Programarla es lo que evita tener que acordarse de encenderla el
          1 de octubre y de apagarla en diciembre: se publica y se retira
          sola, y la web la enseña solo dentro de esa ventana. */}
      {kind === 'SEASONAL' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            name="activeFrom"
            type="date"
            label="Goes live on"
            defaultValue={soloFecha(initial?.activeFrom)}
          />
          <Field
            name="activeTo"
            type="date"
            label="Comes off on"
            defaultValue={soloFecha(initial?.activeTo)}
          />
          <p className="text-[12px] text-stone2-400 sm:col-span-2">
            Leave them blank to keep it available while it is switched on.
          </p>
        </div>
      )}

      <div className="border-t border-stone2-200 pt-4">
        <Eyebrow>The formula</Eyebrow>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Selector
            label="Beans"
            value={build.beans}
            options={cat.beans}
            onChange={(v) => set('beans', v)}
          />
          <Selector
            label="Size"
            value={build.size}
            options={cat.sizes}
            onChange={(v) => set('size', v)}
          />
          <Selector
            label="Base"
            value={build.base}
            options={cat.bases}
            onChange={(v) => set('base', v)}
          />
          <Selector
            label="How it is served"
            value={build.serve}
            options={cat.serves}
            onChange={(v) => set('serve', v)}
          />
          <Selector
            label="Milk"
            value={build.milk}
            options={cat.milks}
            onChange={(v) => set('milk', v)}
          />
          <Selector
            label="Cup"
            value={build.vessel}
            options={cat.vessels}
            onChange={(v) => set('vessel', v)}
          />

          {/* Espuma y dibujo solo salen cuando la bebida los admite. Lo
              decide el servidor, que es quien conoce la regla. */}
          {precio.data?.takesFoam && (
            <Selector
              label="Foam"
              value={build.foam}
              options={cat.foams}
              onChange={(v) => set('foam', v)}
            />
          )}
          {precio.data?.takesArt && (
            <Selector
              label="Latte art"
              value={build.art}
              options={cat.arts}
              onChange={(v) => set('art', v)}
            />
          )}
          <Selector
            label="Sleeve"
            value={build.sleeve}
            options={cat.sleeves}
            onChange={(v) => set('sleeve', v)}
          />
        </div>

        <div className="mt-4">
          <span className="text-[12.5px] font-semibold text-stone2-600">Extras</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cat.extras.map((e) => {
              const puesto = build.extras.includes(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  aria-pressed={puesto}
                  onClick={() => alternarExtra(e.id)}
                  className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                    puesto
                      ? 'border-olive-700/30 bg-olive-500/90 text-stone2-900'
                      : 'border-stone2-200 bg-white/60 text-stone2-600 hover:bg-stone2-900/5'
                  }`}
                >
                  {e.name}
                  {e.price > 0 && <span className="tabular ml-1 opacity-60">+{e.price}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone2-200 bg-white/60 px-4 py-3">
        <div>
          <Eyebrow>Price</Eyebrow>
          <p className="tabular text-[22px] font-bold leading-none text-stone2-900">
            {precio.data ? money(precio.data.price) : '…'}
          </p>
        </div>
        {precio.data && (
          <p className="min-w-0 flex-1 font-mono text-[11.5px] leading-snug text-olive-700">
            {precio.data.ticket}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-olive">
          {pending ? 'Saving…' : initial ? 'Save changes' : 'Create recipe'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-quiet">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Selector({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
}) {
  const id = `sel-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12.5px] font-semibold text-stone2-600">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field tap-target"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
            {o.price !== 0 ? ` · ${o.price > 0 ? '+' : ''}${o.price}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
