import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, ChefHat, Clock, ListChecks, Loader2, MapPin, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { minutesAgo, money, ORDER_STATUS, ORDER_TYPE, time } from '@/lib/format';
import { Card, Chip, ErrorBox, Eyebrow, PageHead, Spinner } from '@/components/ui';

interface QueueItem {
  id: string;
  status: keyof typeof ORDER_STATUS;
  type: string;
  total: number;
  customer: string;
  visits: number;
  isNew: boolean;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  slotTime: string | null;
  confirmationCode: string | null;
  paid: boolean;
  items: { qty: number; name: string; ticket: string | null }[];
}

/** A partir de cuántos minutos un pedido pide atención. */
const TARDE = 12;

/**
 * Qué hace el botón de cada tarjeta.
 *
 * El paso sale del estado real del pedido, no de la columna. Un pedido sin
 * confirmar y uno confirmado comparten columna porque los dos son «por
 * hacer», pero la máquina de estados del servidor no deja saltarse la
 * confirmación, y un botón que promete algo que el servidor rechaza es
 * peor que un botón de más.
 */
const PASO: Record<string, { status: string; label: string }> = {
  PENDING: { status: 'CONFIRMED', label: 'Confirm' },
  CONFIRMED: { status: 'PREPARING', label: 'Start' },
  PREPARING: { status: 'READY', label: 'Served' },
  READY: { status: 'COMPLETED', label: 'Handed over' },
};

/**
 * Las tres fases de la barra.
 *
 * Es el recorrido físico de un café: entra, se hace, se entrega. Antes
 * todos los pedidos caían en una sola lista y había que leer la etiqueta
 * de estado de cada tarjeta para saber cuál tocaba. Ahora lo dice la
 * columna, sin leer nada.
 *
 * `avisa` marca la fase cuyo botón manda correo al cliente. Solo una lo
 * hace, y está escrito aquí para que se vea al cambiar el flujo.
 */
const FASES = [
  {
    id: 'por-hacer',
    titulo: 'To do',
    icono: ListChecks,
    estados: ['PENDING', 'CONFIRMED'] as readonly string[],
    avisa: false,
  },
  {
    id: 'preparando',
    titulo: 'In progress',
    icono: ChefHat,
    estados: ['PREPARING'] as readonly string[],
    avisa: true,
  },
  {
    id: 'servido',
    titulo: 'Served',
    icono: CheckCheck,
    estados: ['READY'] as readonly string[],
    avisa: false,
  },
];

/**
 * La cola de la barra.
 *
 * Un solo botón por tarjeta, el que lleva a la siguiente fase. El personal
 * tiene las manos ocupadas: elegir entre seis estados en un desplegable es
 * más lento que tocar «Servido».
 */
export function QueuePage() {
  const qc = useQueryClient();

  const cola = useQuery({
    queryKey: ['crm', 'queue'],
    queryFn: () => api.get<QueueItem[]>('/crm/queue'),
    // Diez segundos: si entra un pedido mientras la tablet está abierta,
    // aparece solo. Recargar a mano no es opción con prisa.
    refetchInterval: 10_000,
  });

  const cambiar = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    // Pase lo que pase se vuelve a leer la cola. Si dos personas avanzan el
    // mismo pedido, la segunda recibe un error de la máquina de estados y
    // sin esto se quedaría viendo una tarjeta que ya no es cierta.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'queue'] });
      qc.invalidateQueries({ queryKey: ['crm', 'summary'] });
    },
  });

  if (cola.isLoading) return <Spinner label="Loading queue" />;
  if (cola.error) return <ErrorBox error={cola.error} onRetry={() => cola.refetch()} />;

  const pedidos = cola.data ?? [];

  return (
    <>
      <PageHead eyebrow="Bar" title={`Queue · ${pedidos.length}`}>
        {/* Que se vea que el tablero está vivo. En una barra con dos
            personas moviendo pedidos, saber que lo que miras es de hace
            dos segundos y no de hace diez minutos importa. */}
        <span className="flex items-center gap-1.5 text-[12.5px] text-stone2-400">
          {cola.isFetching ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Refreshing…
            </>
          ) : (
            'Refreshes on its own every 10 seconds'
          )}
        </span>
      </PageHead>

      {cambiar.error && <ErrorBox error={cambiar.error} />}

      <div className="grid gap-4 lg:grid-cols-3">
        {FASES.map((fase) => {
          const enFase = pedidos.filter((p) => fase.estados.includes(p.status));
          const Icono = fase.icono;

          return (
            <section key={fase.id} className="flex min-w-0 flex-col gap-3">
              <header className="flex items-center gap-2 px-1">
                <Icono size={16} className="text-stone2-600" />
                <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{fase.titulo}</h2>
                <span className="tabular rounded-full bg-stone2-200 px-2 py-0.5 text-[12px] font-semibold text-stone2-600">
                  {enFase.length}
                </span>
                {/* El aviso al cliente sale de esta fase. Decirlo aquí evita
                    que alguien mueva tarjetas sin saber que manda correos. */}
                {fase.avisa && (
                  <span
                    className="ml-auto flex items-center gap-1 text-[11px] text-olive-700"
                    title="Moving past this step emails the customer"
                  >
                    <Bell size={11} />
                    avisa
                  </span>
                )}
              </header>

              <div className="flex flex-col gap-3">
                {enFase.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone2-200 px-4 py-10 text-center text-[13px] text-stone2-400">
                    Nothing here
                  </div>
                ) : (
                  enFase.map((p) => (
                    <OrderCard
                      key={p.id}
                      order={p}
                      avisa={fase.avisa}
                      working={cambiar.isPending && cambiar.variables?.id === p.id}
                      onAdvance={(status) => cambiar.mutate({ id: p.id, status })}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function OrderCard({
  order,
  avisa,
  working,
  onAdvance,
}: {
  order: QueueItem;
  avisa: boolean;
  working: boolean;
  onAdvance: (status: string) => void;
}) {
  const espera = minutesAgo(order.createdAt);
  const tarde = espera >= TARDE && order.status !== 'READY';
  const siguiente = PASO[order.status];
  // Solo avisa el paso que deja el pedido listo en barra, no la columna
  // entera: confirmar un pedido sin confirmar no manda ningún correo.
  const avisaEste = avisa && siguiente?.status === 'READY';

  return (
    <Card
      className={`flex flex-col gap-3 p-4 transition-opacity ${tarde ? 'border-bark-300' : ''} ${
        working ? 'pointer-events-none opacity-60' : ''
      }`}
      aria-busy={working}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-bold text-stone2-900">{order.customer}</p>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {/* Para eso está el nombre: para decirlo. A la primera se
                saluda distinto que a la vigésima, y eso es lo único que
                una cadena no puede copiar. */}
            {order.isNew ? (
              <span className="text-[11.5px] font-semibold text-olive-700">First time here</span>
            ) : (
              <span className="tabular text-[11.5px] text-stone2-400">visit #{order.visits}</span>
            )}
            <span
              className={`tabular text-[11.5px] ${
                tarde ? 'font-semibold text-bark-700' : 'text-stone2-400'
              }`}
            >
              · {espera} min waiting
            </span>
          </span>
        </div>
        <span className="tabular shrink-0 text-[16px] font-bold text-stone2-900">
          {money(order.total)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip>{ORDER_TYPE[order.type] ?? order.type}</Chip>
        {/* Un pedido sin cobrar es lo primero que hay que ver: se entrega
            contra pago, no contra confianza. */}
        {!order.paid && <Chip tone="ember">Unpaid</Chip>}
        {order.confirmationCode && (
          <Chip>
            <span className="font-mono tracking-[0.08em]">{order.confirmationCode}</span>
          </Chip>
        )}
      </div>

      <ul className="flex flex-col gap-1.5 border-y border-stone2-200 py-2.5">
        {order.items.map((i, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="tabular h-[20px] shrink-0 rounded-full bg-olive-500/90 px-2 text-[12px] font-bold leading-[20px] text-stone2-900">
              {i.qty}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-stone2-900">{i.name}</p>
              {/* La fórmula tal cual la pidió el cliente. Esto es lo que el
                  barista lee para prepararlo. */}
              {i.ticket && (
                <p className="font-mono text-[11px] leading-snug text-olive-700">{i.ticket}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {(order.slotTime || order.notes || order.type === 'DELIVERY') && (
        <div className="flex flex-col gap-1.5">
          {order.slotTime && (
            <p className="flex items-center gap-1.5 text-[12.5px] text-stone2-600">
              <Clock size={12} />
              Pickup at <strong className="tabular">{time(order.slotTime)}</strong>
            </p>
          )}
          {order.type === 'DELIVERY' && (
            <p className="flex items-center gap-1.5 text-[12.5px] text-stone2-600">
              <MapPin size={12} />A domicilio
              {order.phone && (
                <span className="ml-auto flex items-center gap-1 font-mono text-[11.5px]">
                  <Phone size={10} />
                  {order.phone}
                </span>
              )}
            </p>
          )}
          {order.notes && (
            <p className="rounded-lg border border-stone2-200 bg-white/60 px-2.5 py-1.5 text-[12.5px]">
              <Eyebrow>Note</Eyebrow> {order.notes}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto flex gap-2 pt-0.5">
        {siguiente && (
          <button
            type="button"
            disabled={working}
            onClick={() => onAdvance(siguiente.status)}
            className="btn btn-olive tap-target flex-1"
            title={avisaEste ? 'Emails the customer' : undefined}
          >
            {working ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              avisaEste && <Bell size={13} />
            )}
            {working ? 'Saving…' : siguiente.label}
          </button>
        )}
        <button
          type="button"
          disabled={working}
          onClick={() => onAdvance('CANCELLED')}
          className="btn btn-quiet tap-target px-3 text-[12.5px] text-bark-700"
        >
          Cancel
        </button>
      </div>
    </Card>
  );
}
