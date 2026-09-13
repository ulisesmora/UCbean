import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../../prisma/prisma.service';

/**
 * El día de una fecha, en hora del local.
 *
 * `toISOString()` da el día en UTC, y a seis husos de distancia un pedido
 * de las siete de la tarde cae en el día siguiente. El resumen del día ya
 * cuenta desde medianoche local, así que la gráfica tiene que agrupar
 * igual o la misma pantalla enseña dos cifras para el mismo día.
 */
function localDay(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Los estados que siguen vivos en la barra. */
const EN_CURSO = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] as const;

/**
 * Lo que el mostrador necesita saber.
 *
 * El CRM no consulta tablas sueltas y las junta en el navegador: eso son
 * seis peticiones y una cifra distinta en cada pantalla. Aquí se arma el
 * resumen del día de una vez, con las mismas reglas para todos.
 */
@Injectable()
export class CounterService {
  constructor(private readonly prisma: PrismaService) {}

  /** Desde medianoche de hoy, en hora local del local. */
  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * La cola: lo que hay que preparar ahora.
   *
   * Del más viejo al más nuevo, que es el orden en que se atiende. Un
   * pedido cancelado o entregado no aparece: la cola es trabajo pendiente,
   * no historial.
   */
  async queue() {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: [...EN_CURSO] } },
      include: {
        items: true,
        user: { select: { name: true, phone: true } },
        pickupReservation: true,
        payment: { select: { status: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Cuántas veces ha venido cada uno de los que están en la cola ahora.
    // Es lo que convierte un nombre en un saludo: no es lo mismo «hola
    // Mina» que «hola Mina, ¿lo de siempre?», y menos aún saber que es la
    // primera vez de alguien.
    const userIds = [...new Set(orders.map((o) => o.userId))];
    const visitas = userIds.length
      ? await this.prisma.order.groupBy({
          by: ['userId'],
          where: { userId: { in: userIds }, status: { not: 'CANCELLED' } },
          _count: { _all: true },
        })
      : [];
    const porUsuario = new Map(visitas.map((v) => [v.userId, v._count._all]));

    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      type: o.type,
      total: Number(o.total),
      customer: o.user.name,
      phone: o.user.phone,
      /** Pedidos no cancelados de esta persona, este incluido. */
      visits: porUsuario.get(o.userId) ?? 1,
      isNew: (porUsuario.get(o.userId) ?? 1) <= 1,
      notes: o.notes,
      createdAt: o.createdAt,
      slotTime: o.pickupReservation?.slotTime ?? null,
      confirmationCode: o.pickupReservation?.confirmationCode ?? null,
      paid: o.payment?.status === 'succeeded',
      items: o.items.map((i) => ({
        qty: i.qty,
        // Lo que el cliente vio el día que pidió, no lo que diga el
        // catálogo hoy. Un producto renombrado no reescribe el ticket.
        name: i.nameSnapshot ?? 'Drink',
        ticket: i.ticketSnapshot,
        build: i.options,
      })),
    }));
  }

  /** Un pedido con todo su rastro, para resolver una reclamación. */
  async orderDetail(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        pickupReservation: true,
        deliveryAddress: true,
        payment: true,
      },
    });
    if (!order) return order;

    // El rastro de Stripe no cuelga del pedido por clave foránea (un aviso
    // puede llegar de un pedido que ya no está), así que se busca aparte.
    // Es lo que contesta «¿me cobrasteis?» con datos y no con memoria.
    const paymentEvents = await this.prisma.paymentEvent.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        failureCode: true,
        failureMessage: true,
        createdAt: true,
      },
    });
    return { ...order, paymentEvents };
  }

  /**
   * El resumen del día.
   *
   * Las cifras son de hoy, no acumuladas, porque es lo que se mira al
   * cerrar la caja. Las canceladas no cuentan como venta.
   */
  async summary() {
    const desde = this.startOfToday();

    const [porEstado, ventas, cola, clientesNuevos, canjes, slotsOcupados] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: desde } },
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: desde }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.count({ where: { status: { in: [...EN_CURSO] } } }),
      this.prisma.user.count({ where: { createdAt: { gte: desde } } }),
      this.prisma.rewardRedemption.count({
        where: { createdAt: { gte: desde } },
      }),
      this.prisma.pickupReservation.count({ where: { slotTime: { gte: desde } } }),
    ]);

    const cobrado = await this.prisma.payment.aggregate({
      where: { paidAt: { gte: desde }, status: 'succeeded' },
      _sum: { amount: true },
    });

    return {
      fecha: desde,
      pedidosHoy: ventas._count,
      ventaHoy: Number(ventas._sum.total ?? 0),
      cobradoHoy: Number(cobrado._sum.amount ?? 0),
      enCola: cola,
      clientesNuevos,
      canjesHoy: canjes,
      recogidasAgendadas: slotsOcupados,
      porEstado: Object.fromEntries(porEstado.map((p) => [p.status, p._count])),
    };
  }

  /**
   * Las bebidas más pedidas.
   *
   * Sale de la fórmula guardada en la línea, no del catálogo, así que
   * cuenta lo que de verdad se preparó, incluidas las que el cliente
   * armó a su manera.
   */
  async topDrinks(days = 7) {
    const desde = new Date(Date.now() - days * 24 * 3600_000);
    const lines = await this.prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: desde }, status: { not: 'CANCELLED' } } },
      select: { qty: true, nameSnapshot: true, recipeId: true },
    });

    const cuenta = new Map<string, number>();
    for (const l of lines) {
      const clave = l.nameSnapshot ?? l.recipeId ?? 'Unnamed';
      cuenta.set(clave, (cuenta.get(clave) ?? 0) + l.qty);
    }

    return [...cuenta.entries()]
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }

  /** Venta por día, para dibujar la tendencia. */
  async salesByDay(days = 14) {
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    desde.setDate(desde.getDate() - (days - 1));

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: desde }, status: { not: 'CANCELLED' } },
      select: { createdAt: true, total: true },
    });

    // Se arman todos los días del rango aunque no haya ventas: una
    // gráfica que salta del lunes al jueves miente sobre el martes.
    const porDia = new Map<string, { total: number; pedidos: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(desde);
      d.setDate(desde.getDate() + i);
      porDia.set(localDay(d), { total: 0, pedidos: 0 });
    }

    for (const o of orders) {
      const clave = localDay(o.createdAt);
      const dia = porDia.get(clave);
      if (dia) {
        dia.total += Number(o.total);
        dia.pedidos += 1;
      }
    }

    return [...porDia.entries()].map(([date, v]) => ({
      date,
      total: Math.round(v.total * 100) / 100,
      pedidos: v.pedidos,
    }));
  }

  /**
   * Los clientes, con lo que de verdad importa de cada uno.
   *
   * Puntos, cuánto ha gastado y cuándo vino por última vez. Sin esto el
   * mostrador no puede ajustar puntos ni resolver una queja: el endpoint
   * de lealtad pide un id de usuario que no había forma de averiguar.
   */
  async customers(search?: string) {
    const users = await this.prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        marketingOptIn: true,
        emailVerifiedAt: true,
        loyaltyCard: { select: { id: true, stamps: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (users.length === 0) return [];

    const ids = users.map((u) => u.id);

    // Tres consultas agrupadas en vez de tres por persona: con cien
    // clientes eso serían trescientas idas a la base para pintar una lista.
    const [gastos, ultimos, saldos] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['userId'],
        where: { userId: { in: ids }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.groupBy({
        by: ['userId'],
        where: { userId: { in: ids } },
        _max: { createdAt: true },
      }),
      this.prisma.pointsEntry.groupBy({
        by: ['cardId'],
        where: { cardId: { in: users.map((u) => u.loyaltyCard?.id).filter(Boolean) as string[] } },
        _sum: { delta: true },
      }),
    ]);

    const porGasto = new Map(gastos.map((g) => [g.userId, g]));
    const porUltimo = new Map(ultimos.map((u) => [u.userId, u._max.createdAt]));
    const porTarjeta = new Map(saldos.map((s) => [s.cardId, s._sum.delta ?? 0]));

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      createdAt: u.createdAt,
      marketingOptIn: u.marketingOptIn,
      verificado: u.emailVerifiedAt !== null,
      puntos: u.loyaltyCard ? (porTarjeta.get(u.loyaltyCard.id) ?? 0) : 0,
      sellos: u.loyaltyCard?.stamps ?? 0,
      pedidos: porGasto.get(u.id)?._count ?? 0,
      gastado: Number(porGasto.get(u.id)?._sum.total ?? 0),
      ultimoPedido: porUltimo.get(u.id) ?? null,
    }));
  }

  /** Un cliente con su historial, para atender una reclamación. */
  async customerDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        birthday: true,
        marketingOptIn: true,
        emailVerifiedAt: true,
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { items: true, payment: { select: { status: true } } },
        },
        loyaltyCard: {
          include: {
            entries: { orderBy: { createdAt: 'desc' }, take: 30 },
            redemptions: { include: { reward: true }, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });
    if (!user) return null;

    const puntos = (user.loyaltyCard?.entries ?? []).reduce((s, e) => s + e.delta, 0);
    return { ...user, puntos, sellos: user.loyaltyCard?.stamps ?? 0 };
  }

  /**
   * El historial de pedidos.
   *
   * La cola solo enseña lo que está en marcha. Esto es lo que se mira
   * cuando alguien llama preguntando por un pedido de ayer.
   */
  async orderHistory(opts: { status?: string; days?: number; search?: string } = {}) {
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    desde.setDate(desde.getDate() - ((opts.days ?? 7) - 1));

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: desde },
        ...(opts.status ? { status: opts.status as never } : {}),
        ...(opts.search
          ? { user: { name: { contains: opts.search, mode: 'insensitive' as const } } }
          : {}),
      },
      include: {
        items: true,
        user: { select: { id: true, name: true } },
        payment: { select: { status: true } },
        pickupReservation: { select: { slotTime: true, confirmationCode: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      type: o.type,
      total: Number(o.total),
      createdAt: o.createdAt,
      customer: o.user.name,
      customerId: o.user.id,
      paid: o.payment?.status === 'succeeded',
      slotTime: o.pickupReservation?.slotTime ?? null,
      lines: o.items.length,
      items: o.items.map((i) => ({
        qty: i.qty,
        name: i.nameSnapshot ?? 'Drink',
        ticket: i.ticketSnapshot,
      })),
    }));
  }

  /* ── El equipo ────────────────────────────────────────────
   *
   * Quién puede entrar al mostrador. Hasta ahora la única forma de
   * crear personal era la semilla o tocar la base a mano, así que dar
   * de alta a alguien nuevo exigía un despliegue.
   */

  async staff() {
    const users = await this.prisma.user.findMany({
      where: { role: { in: ['OWNER', 'STAFF'] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerifiedAt: true,
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
    return users.map((u) => ({ ...u, verificado: u.emailVerifiedAt !== null }));
  }

  async createStaff(input: {
    name: string;
    email: string;
    password: string;
    role: 'OWNER' | 'STAFF';
  }) {
    const email = input.email.trim().toLowerCase();
    const existente = await this.prisma.user.findUnique({ where: { email } });

    // Ascender a un cliente que ya tiene cuenta es lo normal: el barista
    // nuevo suele ser alguien que ya pedía café aquí. Lo que no se hace
    // nunca es pisarle la contraseña.
    if (existente) {
      if (existente.role !== 'CUSTOMER') {
        throw new ConflictException('That person is already on the team');
      }
      const ascendido = await this.prisma.user.update({
        where: { email },
        data: { role: input.role },
        select: { id: true, name: true, email: true, role: true },
      });
      return { ...ascendido, ascendido: true };
    }

    const creado = await this.prisma.user.create({
      data: {
        name: input.name,
        email,
        passwordHash: await bcrypt.hash(input.password, 12),
        role: input.role,
        // El personal no valida su correo: lo da de alta el dueño en
        // persona, que es una comprobación más fuerte que un enlace.
        emailVerifiedAt: new Date(),
      },
      select: { id: true, name: true, email: true, role: true },
    });
    return { ...creado, ascendido: false };
  }

  /**
   * Cambia el rol de alguien del equipo.
   *
   * Nunca deja el local sin dueño: quitar el último OWNER significaría
   * que ya nadie puede volver a dar de alta a nadie.
   */
  async setRole(id: string, role: 'OWNER' | 'STAFF' | 'CUSTOMER') {
    const actual = await this.prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!actual) throw new BadRequestException('That person does not exist');

    if (actual.role === 'OWNER' && role !== 'OWNER') {
      const duenos = await this.prisma.user.count({ where: { role: 'OWNER' } });
      if (duenos <= 1) {
        throw new BadRequestException(
          'They are the only owner. Make someone else owner before removing the role.',
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  /* ── Caja ─────────────────────────────────────────────────
   *
   * Los cobros con tarjeta, que hasta ahora solo se podían consultar de
   * uno en uno y desde la cuenta del propio cliente.
   */

  async payments(days = 7) {
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    desde.setDate(desde.getDate() - (days - 1));

    const pagos = await this.prisma.payment.findMany({
      where: { createdAt: { gte: desde } },
      include: {
        order: {
          select: {
            id: true,
            type: true,
            status: true,
            total: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Cobrado es lo que entró y se quedó: un reembolso resta, y un cobro
    // reembolsado ya no es «pendiente». Antes cualquier estado distinto de
    // `succeeded` contaba como pendiente, y un reembolso inflaba lo que
    // parecía faltar por cobrar.
    const COBRADOS = ['succeeded', 'refunded', 'partially_refunded', 'disputed'];
    const ABIERTOS = ['requires_payment_method', 'requires_action', 'processing'];
    const cobrado = pagos
      .filter((p) => COBRADOS.includes(p.status))
      .reduce((s, p) => s + Number(p.amount) - Number(p.amountRefunded), 0);
    const pendiente = pagos
      .filter((p) => ABIERTOS.includes(p.status))
      .reduce((s, p) => s + Number(p.amount), 0);

    // Lo que se paga en el mostrador no deja fila en Payment, así que se
    // cuenta aparte. Sin esto el corte de caja parecería la mitad de lo
    // que de verdad entró.
    const enMostrador = await this.prisma.order.aggregate({
      where: { createdAt: { gte: desde }, status: 'COMPLETED', payment: { is: null } },
      _sum: { total: true },
      _count: true,
    });

    return {
      cobrado: Math.round(cobrado * 100) / 100,
      pendiente: Math.round(pendiente * 100) / 100,
      enMostrador: Number(enMostrador._sum.total ?? 0),
      pedidosEnMostrador: enMostrador._count,
      pagos: pagos.map((p) => ({
        id: p.id,
        status: p.status,
        method: p.method,
        failureCode: p.failureCode,
        failureMessage: p.failureMessage,
        amountRefunded: Number(p.amountRefunded),
        amount: Number(p.amount),
        paidAt: p.paidAt,
        createdAt: p.createdAt,
        stripeIntentId: p.stripeIntentId,
        orderId: p.orderId,
        customer: p.order.user.name,
        orderStatus: p.order.status,
        orderType: p.order.type,
      })),
    };
  }

  /**
   * El informe de ventas.
   *
   * Responde las cuatro preguntas que se hacen al cerrar el mes: cuánto
   * entró, de qué, cómo se pagó y cómo se llevaron el pedido. Todo sale de
   * la misma consulta de líneas, así que las cifras cuadran entre sí; cada
   * bloque calculado por su lado es como aparecen informes que se
   * contradicen.
   */
  async salesReport(days = 30) {
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    desde.setDate(desde.getDate() - (days - 1));

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: desde }, status: { not: 'CANCELLED' } },
      include: {
        items: { include: { product: { include: { category: true } } } },
        payment: { select: { status: true } },
      },
    });

    const canceladas = await this.prisma.order.count({
      where: { createdAt: { gte: desde }, status: 'CANCELLED' },
    });

    let ingreso = 0;
    let unidades = 0;
    const porDia = new Map<string, { total: number; pedidos: number }>();
    const porCategoria = new Map<string, { total: number; unidades: number }>();
    const porProducto = new Map<string, { total: number; unidades: number }>();
    const porTipo = new Map<string, { total: number; pedidos: number }>();
    let conTarjeta = 0;
    let enMostrador = 0;

    // Todos los días del rango, aunque no haya venta: un informe que salta
    // del lunes al jueves miente sobre el martes.
    for (let i = 0; i < days; i++) {
      const d = new Date(desde);
      d.setDate(desde.getDate() + i);
      porDia.set(localDay(d), { total: 0, pedidos: 0 });
    }

    for (const o of orders) {
      const total = Number(o.total);
      ingreso += total;

      const dia = porDia.get(localDay(o.createdAt));
      if (dia) {
        dia.total += total;
        dia.pedidos += 1;
      }

      const tipo = porTipo.get(o.type) ?? { total: 0, pedidos: 0 };
      tipo.total += total;
      tipo.pedidos += 1;
      porTipo.set(o.type, tipo);

      if (o.payment?.status === 'succeeded') conTarjeta += total;
      else enMostrador += total;

      for (const l of o.items) {
        const importe = Number(l.unitPrice) * l.qty;
        unidades += l.qty;

        // El nombre guardado el día del pedido manda sobre el del catálogo:
        // un producto renombrado no debería partirse en dos filas.
        const nombre = l.nameSnapshot ?? l.product.name;
        const prod = porProducto.get(nombre) ?? { total: 0, unidades: 0 };
        prod.total += importe;
        prod.unidades += l.qty;
        porProducto.set(nombre, prod);

        const cat = l.product.category.name;
        const c = porCategoria.get(cat) ?? { total: 0, unidades: 0 };
        c.total += importe;
        c.unidades += l.qty;
        porCategoria.set(cat, c);
      }
    }

    const redondo = (n: number) => Math.round(n * 100) / 100;
    const lista = <T extends { total: number }>(m: Map<string, T>) =>
      [...m.entries()]
        .map(([name, v]) => ({ name, ...v, total: redondo(v.total) }))
        .sort((a, b) => b.total - a.total);

    return {
      desde,
      dias: days,
      ingreso: redondo(ingreso),
      pedidos: orders.length,
      unidades,
      // Lo que de verdad se pregunta el dueño: cuánto deja cada visita.
      ticketMedio: orders.length ? redondo(ingreso / orders.length) : 0,
      canceladas,
      conTarjeta: redondo(conTarjeta),
      enMostrador: redondo(enMostrador),
      porDia: [...porDia.entries()].map(([date, v]) => ({
        date,
        total: redondo(v.total),
        pedidos: v.pedidos,
      })),
      porCategoria: lista(porCategoria),
      porProducto: lista(porProducto).slice(0, 12),
      porTipo: lista(porTipo),
    };
  }

  /** Reservas de mesa del día en adelante. */
  async tableReservations() {
    return this.prisma.tableReservation.findMany({
      where: { scheduledAt: { gte: this.startOfToday() } },
      include: { user: { select: { name: true, phone: true } }, table: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  setReservationStatus(id: string, status: string) {
    return this.prisma.tableReservation.update({
      where: { id },
      data: { status: status as never },
      include: { table: true },
    });
  }
}
