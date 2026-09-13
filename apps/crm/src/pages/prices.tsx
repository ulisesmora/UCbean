import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { Card, ErrorBox, Eyebrow, PageHead, Spinner } from '@/components/ui';
import { useIsOwner } from '@/stores/auth';

interface PriceOption {
  id: string;
  name: string;
  note: string;
  price: number;
  defaultPrice: number;
}

interface PriceGroup {
  group: string;
  options: PriceOption[];
}

const LABEL: Record<string, string> = {
  beans: 'Beans',
  sizes: 'Size',
  bases: 'Drink',
  serves: 'Hot, iced or blended',
  milks: 'Milk',
  foams: 'Foam',
  arts: 'Latte art',
  extras: 'Extras',
  vessels: 'Cup',
  sleeves: 'Sleeve',
};

const HINT: Record<string, string> = {
  bases: 'The starting price of each drink. Everything else is added to it.',
  sizes: 'Added to the drink for a bigger cup.',
  serves: 'Added when the drink is served iced or blended.',
  vessels: 'Can be negative: a discount for a cup there is nothing to throw away.',
};

/**
 * Prices, part by part.
 *
 * A drink costs the sum of its parts. The website's builder, every order and
 * every recipe without a fixed price follow these numbers, and recipe products
 * on the menu update the moment one is saved. Before this they were written in
 * the code and nobody at the counter could change them.
 */
export function PricesPage() {
  const esDueno = useIsOwner();
  const qc = useQueryClient();

  const precios = useQuery({
    queryKey: ['crm', 'drink-prices'],
    queryFn: () => api.get<PriceGroup[]>('/drinks/prices'),
  });

  const guardar = useMutation({
    mutationFn: ({ group, id, price }: { group: string; id: string; price: number | null }) =>
      api.patch<PriceGroup[]>(`/drinks/prices/${group}/${id}`, { price }),
    onSuccess: (data) => {
      qc.setQueryData(['crm', 'drink-prices'], data);
      // Recipe prices and the price preview in the recipe form follow.
      qc.invalidateQueries({ queryKey: ['crm', 'recipes'] });
      qc.invalidateQueries({ queryKey: ['drinks'] });
    },
  });

  if (precios.isLoading) return <Spinner label="Loading prices" />;
  if (precios.error) return <ErrorBox error={precios.error} onRetry={() => precios.refetch()} />;

  return (
    <>
      <PageHead eyebrow="Menu" title="Prices" />
      <p className="mb-6 max-w-2xl text-[14px] leading-relaxed text-stone2-600">
        What each part of a drink adds to its price. A drink costs the sum of its parts: the website
        builder, orders and every recipe without a fixed price use these numbers. Recipe products on
        the website update as soon as you save.
      </p>

      {guardar.error && <ErrorBox error={guardar.error} />}

      <div className="grid gap-4 lg:grid-cols-2">
        {(precios.data ?? []).map((g) => (
          <Card key={g.group}>
            <Eyebrow>{LABEL[g.group] ?? g.group}</Eyebrow>
            {HINT[g.group] && <p className="mt-1 text-[12.5px] text-stone2-400">{HINT[g.group]}</p>}
            <ul className="mt-3 flex flex-col divide-y divide-stone2-200">
              {g.options.map((o) => (
                <PriceRow
                  key={o.id}
                  group={g.group}
                  option={o}
                  canEdit={esDueno}
                  saving={guardar.isPending}
                  onSave={(price) => guardar.mutate({ group: g.group, id: o.id, price })}
                />
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {!esDueno && (
        <p className="mt-6 text-[13px] text-stone2-400">Only the owner can change prices.</p>
      )}
    </>
  );
}

function PriceRow({
  group,
  option,
  canEdit,
  saving,
  onSave,
}: {
  group: string;
  option: PriceOption;
  canEdit: boolean;
  saving: boolean;
  onSave: (price: number | null) => void;
}) {
  const [value, setValue] = useState(option.price.toFixed(2));
  const [saved, setSaved] = useState(option.price);
  // After a save the server's figure is the truth: the field follows it.
  if (saved !== option.price) {
    setSaved(option.price);
    setValue(option.price.toFixed(2));
  }

  const parsed = Math.round(Number(value) * 100) / 100;
  const valid = value.trim() !== '' && Number.isFinite(parsed);
  const changed = valid && parsed !== option.price;
  const custom = option.price !== option.defaultPrice;
  const id = `price-${group}-${option.id}`;

  return (
    <li className="flex flex-wrap items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-[14.5px] font-semibold text-stone2-900">
          {option.name}
        </label>
        <p className="text-[12px] text-stone2-400">
          {option.note}
          {custom && ` · default ${money(option.defaultPrice)}`}
        </p>
      </div>

      <input
        id={id}
        type="number"
        inputMode="decimal"
        step="0.05"
        min="-50"
        max="500"
        value={value}
        disabled={!canEdit}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && changed) onSave(parsed);
        }}
        className="field tap-target tabular w-24 text-right"
      />

      {canEdit && changed && (
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(parsed)}
          className="btn btn-olive px-3 py-1.5 text-[12.5px]"
        >
          Save
        </button>
      )}
      {canEdit && custom && !changed && (
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(null)}
          aria-label={`Reset ${option.name} to its default price`}
          title="Back to the default price"
          className="btn btn-quiet px-2 py-1.5"
        >
          <RotateCcw size={13} />
        </button>
      )}
    </li>
  );
}
