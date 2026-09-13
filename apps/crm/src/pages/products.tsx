import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Plus, Trash2 } from 'lucide-react';
import { ImageUpload } from '@/components/image-upload';
import { api, imageSrc } from '@/lib/api';
import { money } from '@/lib/format';
import { Card, Chip, Empty, ErrorBox, Eyebrow, Field, PageHead, Spinner } from '@/components/ui';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  categoryId: string;
  imageUrl: string | null;
  /** Set when the product is a recipe: name and price then come from Recipes. */
  recipe?: { slug: string } | null;
}

interface Category {
  id: string;
  name: string;
}

/**
 * El catálogo.
 *
 * Faltaba entera: la API tenía alta, edición y baja desde el principio y
 * no había pantalla, así que cambiar el precio de una bolsa de grano
 * exigía entrar a la base a mano.
 *
 * Las bebidas se configuran en Recetas, no aquí. Esto es para lo que se
 * vende tal cual: grano, pasteles, y la fila que ancla los cafés hechos a
 * medida.
 */
export function ProductsPage() {
  const qc = useQueryClient();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [nuevaCategoria, setNuevaCategoria] = useState(false);

  const productos = useQuery({
    queryKey: ['crm', 'products'],
    queryFn: () => api.get<Product[]>('/products'),
  });

  const categorias = useQuery({
    queryKey: ['crm', 'categories'],
    queryFn: () => api.get<Category[]>('/products/categories'),
  });

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['crm', 'products'] });
    setCreando(false);
    setEditando(null);
  };

  const crear = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/products', body),
    onSuccess: invalidar,
  });

  const editar = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      api.patch(`/products/${id}`, body),
    onSuccess: invalidar,
  });

  const borrar = useMutation({
    mutationFn: (id: string) => api.del(`/products/${id}`),
    onSuccess: invalidar,
  });

  const refrescarCategorias = () => {
    qc.invalidateQueries({ queryKey: ['crm', 'categories'] });
    setNuevaCategoria(false);
  };

  const crearCategoria = useMutation({
    mutationFn: (name: string) => api.post('/products/categories', { name }),
    onSuccess: refrescarCategorias,
  });

  if (productos.isLoading) return <Spinner label="Loading catalogue" />;
  if (productos.error)
    return <ErrorBox error={productos.error} onRetry={() => productos.refetch()} />;

  const todos = productos.data ?? [];
  const porCategoria = new Map<string, Product[]>();
  for (const p of todos) {
    porCategoria.set(p.categoryId, [...(porCategoria.get(p.categoryId) ?? []), p]);
  }
  const nombreCategoria = new Map((categorias.data ?? []).map((c) => [c.id, c.name]));

  return (
    <>
      <PageHead eyebrow="Catalogue" title="Products">
        <button type="button" onClick={() => setNuevaCategoria((v) => !v)} className="btn">
          <FolderPlus size={15} />
          New category
        </button>
        <button
          type="button"
          onClick={() => {
            setEditando(null);
            setCreando((v) => !v);
          }}
          className="btn btn-olive"
        >
          <Plus size={15} />
          New product
        </button>
      </PageHead>

      {(crear.error || editar.error || borrar.error || crearCategoria.error) && (
        <ErrorBox error={crear.error ?? editar.error ?? borrar.error ?? crearCategoria.error} />
      )}

      {nuevaCategoria && (
        <Card className="mb-6">
          <Eyebrow>New category</Eyebrow>
          <form
            className="mt-3 flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              crearCategoria.mutate(String(f.get('name')));
            }}
          >
            <div className="min-w-[220px] flex-1">
              <Field name="name" label="Name" required placeholder="Pastries" />
            </div>
            <button type="submit" disabled={crearCategoria.isPending} className="btn btn-olive">
              {crearCategoria.isPending ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setNuevaCategoria(false)}
              className="btn btn-quiet"
            >
              Cancel
            </button>
          </form>
        </Card>
      )}

      {creando && (
        <Card className="mb-6">
          <Eyebrow>New product</Eyebrow>
          <ProductForm
            categories={categorias.data ?? []}
            pending={crear.isPending}
            onCancel={() => setCreando(false)}
            onSubmit={(body) => crear.mutate(body)}
          />
        </Card>
      )}

      {todos.length === 0 && (
        <Empty title="Empty catalogue" hint="Add beans, pastries or anything sold as is." />
      )}

      {[...porCategoria.entries()].map(([catId, lista]) => (
        <section key={catId} className="mb-8">
          <div className="mb-3 flex items-baseline gap-2">
            <Eyebrow>{nombreCategoria.get(catId) ?? 'No category'}</Eyebrow>
            <span className="text-[12px] text-stone2-300">
              {lista.length} {lista.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {lista.map((p) =>
              editando === p.id ? (
                <Card key={p.id} className="md:col-span-2 xl:col-span-3">
                  <Eyebrow>Editando {p.name}</Eyebrow>
                  <ProductForm
                    categories={categorias.data ?? []}
                    initial={p}
                    pending={editar.isPending}
                    onCancel={() => setEditando(null)}
                    onSubmit={(body) => editar.mutate({ id: p.id, ...body })}
                  />
                </Card>
              ) : (
                <Card
                  key={p.id}
                  hover
                  className={`flex flex-col gap-2 ${p.isAvailable ? '' : 'opacity-55'}`}
                >
                  {p.imageUrl && (
                    <img
                      src={imageSrc(p.imageUrl) ?? undefined}
                      alt=""
                      loading="lazy"
                      // La proporcion se reserva antes de cargar, para que
                      // la rejilla no salte cuando entran las fotos.
                      className="mb-1 aspect-[16/10] w-full rounded-lg object-cover"
                    />
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 truncate text-[16px] font-semibold text-stone2-900">
                      {p.name}
                    </h3>
                    <span className="tabular shrink-0 text-[16px] font-bold text-stone2-900">
                      {money(Number(p.price))}
                    </span>
                  </div>

                  {p.description && (
                    <p className="text-[13px] leading-snug text-stone2-400">{p.description}</p>
                  )}

                  <div className="mt-auto flex items-center gap-1.5 pt-2">
                    <Chip tone={p.isAvailable ? 'olive' : 'neutral'}>
                      {p.isAvailable ? 'On sale' : 'Sold out'}
                    </Chip>
                    {p.recipe && <Chip tone="neutral">Recipe</Chip>}
                    <button
                      type="button"
                      onClick={() => editar.mutate({ id: p.id, isAvailable: !p.isAvailable })}
                      className="btn btn-quiet ml-auto px-2.5 py-1 text-[12.5px]"
                    >
                      {p.isAvailable ? 'Mark sold out' : 'Restock'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreando(false);
                        setEditando(p.id);
                      }}
                      className="btn px-2.5 py-1 text-[12.5px]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${p.name}`}
                      onClick={() => borrar.mutate(p.id)}
                      className="btn btn-quiet px-2 py-1 text-bark-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              ),
            )}
          </div>
        </section>
      ))}
    </>
  );
}

function ProductForm({
  categories,
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  categories: Category[];
  initial?: Product;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);

  return (
    <form
      className="mt-3 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSubmit({
          name: String(f.get('name')),
          description: String(f.get('description')) || undefined,
          price: Number(f.get('price')),
          categoryId: String(f.get('categoryId')),
          // Null explicito para poder quitar una foto: `undefined` se cae
          // del JSON y el backend no se enteraria del borrado.
          imageUrl: imageUrl ?? null,
        });
      }}
    >
      <ImageUpload value={imageUrl} onChange={setImageUrl} />
      {initial?.recipe && (
        <p className="text-[12.5px] text-stone2-600">
          This product is a recipe. Its name, description and price come from its formula: edit them
          in Recipes. Photo, section and sold out are set here.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
        <Field
          name="name"
          label="Name"
          required
          defaultValue={initial?.name}
          readOnly={Boolean(initial?.recipe)}
        />
        <Field
          name="price"
          label="Price"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={initial?.price}
          readOnly={Boolean(initial?.recipe)}
        />
      </div>

      <Field
        name="description"
        label="Description"
        defaultValue={initial?.description ?? ''}
        placeholder="250g · caramel, red apple"
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryId" className="text-[12.5px] font-semibold text-stone2-600">
          Category
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={initial?.categoryId}
          className="field tap-target"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-olive">
          {pending ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-quiet">
          Cancel
        </button>
      </div>
    </form>
  );
}
