import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Power } from 'lucide-react';
import { api, imageSrc } from '@/lib/api';
import { money } from '@/lib/format';
import { Card, Chip, Empty, ErrorBox, Eyebrow, PageHead, Spinner } from '@/components/ui';
import { useIsOwner } from '@/stores/auth';
import { RecipeForm, type RecipeDraft } from '@/components/recipe-form';

interface Recipe {
  id: string;
  slug: string;
  name: string;
  accent: string | null;
  kind: 'SIGNATURE' | 'SEASONAL';
  note: string;
  season: string | null;
  isActive: boolean;
  activeFrom: string | null;
  activeTo: string | null;
  price: number;
  ticket: string;
  build: Record<string, unknown>;
  /** The product it is sold as on the website. */
  productId: string | null;
  imageUrl: string | null;
  categoryId: string | null;
}

/**
 * El menú, editable.
 *
 * El precio no aparece como campo porque no se teclea: sale de la fórmula.
 * Enseñarlo como algo escribible invitaría a que dejara de cuadrar con lo
 * que cobra la caja.
 */
export function RecipesPage() {
  const qc = useQueryClient();
  const esDueno = useIsOwner();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Recipe | null>(null);

  const recetas = useQuery({
    queryKey: ['crm', 'recipes'],
    queryFn: () => api.get<Recipe[]>('/recipes/all'),
  });

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ['crm', 'recipes'] });
    setCreando(false);
    setEditando(null);
  };

  const alternar = useMutation({
    mutationFn: (r: Recipe) => api.patch(`/recipes/${r.id}`, { ...r, isActive: !r.isActive }),
    onSuccess: refrescar,
  });

  const crear = useMutation({
    mutationFn: (draft: Omit<RecipeDraft, 'id'>) => api.post('/recipes', draft),
    onSuccess: refrescar,
  });

  const editar = useMutation({
    mutationFn: ({ id, ...draft }: RecipeDraft & { id: string }) =>
      api.patch(`/recipes/${id}`, draft),
    onSuccess: refrescar,
  });

  if (recetas.isLoading) return <Spinner label="Loading menu" />;
  if (recetas.error) return <ErrorBox error={recetas.error} onRetry={() => recetas.refetch()} />;

  const todas = recetas.data ?? [];
  const firmas = todas.filter((r) => r.kind === 'SIGNATURE');
  const temporada = todas.filter((r) => r.kind === 'SEASONAL');

  return (
    <>
      <PageHead eyebrow="Menu" title="Recipes">
        <span className="text-[13px] text-stone2-400">
          {todas.filter((r) => r.isActive).length} active of {todas.length}
        </span>
        {esDueno && (
          <button
            type="button"
            onClick={() => {
              setEditando(null);
              setCreando((v) => !v);
            }}
            className="btn btn-olive"
          >
            <Plus size={15} />
            New recipe
          </button>
        )}
      </PageHead>

      {(alternar.error || crear.error || editar.error) && (
        <ErrorBox error={alternar.error ?? crear.error ?? editar.error} />
      )}

      {creando && (
        <Card className="mb-6">
          <Eyebrow>New recipe</Eyebrow>
          <RecipeForm
            pending={crear.isPending}
            onCancel={() => setCreando(false)}
            onSubmit={(draft) => crear.mutate(draft)}
          />
        </Card>
      )}

      {editando && (
        <Card className="mb-6">
          <Eyebrow>Editando {editando.name}</Eyebrow>
          <RecipeForm
            initial={editando as unknown as RecipeDraft}
            pending={editar.isPending}
            onCancel={() => setEditando(null)}
            onSubmit={(draft) => editar.mutate({ ...draft, id: editando.id })}
          />
        </Card>
      )}

      <Section
        title="Signature"
        recipes={firmas}
        onToggle={alternar.mutate}
        onEdit={(r) => {
          setCreando(false);
          setEditando(r);
        }}
        canEdit={esDueno}
      />
      <Section
        title="Seasonal"
        recipes={temporada}
        onToggle={alternar.mutate}
        onEdit={(r) => {
          setCreando(false);
          setEditando(r);
        }}
        canEdit={esDueno}
      />

      {!esDueno && (
        <p className="mt-6 text-[13px] text-stone2-400">
          Only the owner can switch a drink on or off.
        </p>
      )}
    </>
  );
}

/** Dia y mes, que es lo que se mira de una fecha de temporada. */
const dia = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { day: 'numeric', month: 'short' });

/**
 * Qué pasa con la ventana de una receta de temporada.
 *
 * Devuelve null cuando no hay nada que contar: sin fechas, o dentro de la
 * ventana, la receta ya se explica con «En carta».
 */
function ventana(r: Recipe): string | null {
  const ahora = Date.now();
  if (r.activeFrom && new Date(r.activeFrom).getTime() > ahora) {
    return `Starts ${dia(r.activeFrom)}`;
  }
  if (r.activeTo && new Date(r.activeTo).getTime() < ahora) {
    return `Ended ${dia(r.activeTo)}`;
  }
  if (r.activeTo) return `Until ${dia(r.activeTo)}`;
  return null;
}

function Section({
  title,
  recipes,
  onToggle,
  onEdit,
  canEdit,
}: {
  title: string;
  recipes: Recipe[];
  onToggle: (r: Recipe) => void;
  onEdit: (r: Recipe) => void;
  canEdit: boolean;
}) {
  if (recipes.length === 0) {
    return (
      <section className="mb-8">
        <div className="mb-3">
          <Eyebrow>{title}</Eyebrow>
        </div>
        <Empty title={`No ${title.toLowerCase()} drinks`} />
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="mb-3">
        <Eyebrow>{title}</Eyebrow>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {recipes.map((r) => (
          <Card key={r.id} className={`flex flex-col gap-2 ${r.isActive ? '' : 'opacity-55'}`}>
            {r.imageUrl && (
              <img
                src={imageSrc(r.imageUrl) ?? undefined}
                alt=""
                loading="lazy"
                className="mb-1 aspect-[16/10] w-full rounded-lg object-cover"
              />
            )}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-[17px] font-extrabold text-stone2-900">{r.name}</h3>
                {r.accent && <span className="text-[13px] text-stone2-400">{r.accent}</span>}
              </div>
              <span className="tabular shrink-0 text-[17px] font-extrabold text-stone2-900">
                {money(r.price)}
              </span>
            </div>

            <p className="text-[13px] leading-snug text-stone2-600">{r.note}</p>

            <p className="font-mono text-[11px] leading-snug text-olive-700">{r.ticket}</p>

            <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
              {r.season && <Chip>{r.season}</Chip>}
              {r.productId && <Chip tone="neutral">On the website</Chip>}
              {/* Encendida pero fuera de su ventana es el estado que engaña:
                  aquí pone «En carta» y en la web no sale. Se dice. */}
              {ventana(r) && <Chip tone="neutral">{ventana(r)}</Chip>}
              <Chip tone={r.isActive ? 'olive' : 'neutral'}>
                {r.isActive ? 'On the menu' : 'Off'}
              </Chip>
              {canEdit && (
                <div className="ml-auto flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(r)}
                    className="btn px-2.5 py-1 text-[12.5px]"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(r)}
                    className="btn btn-quiet px-2.5 py-1 text-[12.5px]"
                  >
                    <Power size={13} />
                    {r.isActive ? 'Turn off' : 'Turn on'}
                  </button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
