import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../../prisma/prisma.service';
import { StripeClient } from '../../infrastructure/stripe.client';
import {
  EVENTS,
  type OrderStatusChangedEvent,
  type PaymentFailedEvent,
  type PaymentRefundedEvent,
} from '../../../../common/events/domain-events';
import { esDuplicado, serializable } from '../../../../prisma/transaction';

/** Moneda de la cafetería. Está en Vancouver. */
export const CURRENCY = 'cad';

/** Estados que Stripe usa y que nos importan. */
type StripeStatus =
  'requires_payment_method' | 'requires_action' | 'processing' | 'succeeded' | 'canceled' | string;

/** Un evento de Stripe tal como llega al webhook. */
export interface StripeEvent {
  /** `evt_...`. Stripe lo repite idéntico en cada reintento. */
  id?: string;
  type: string;
  data: { object: Record<string, any> };
}

/**
 * El cobro de un pedido.
 *
 * El flujo es el estándar de Stripe y tiene cuatro pasos:
 *
 *   1. El cliente crea el pedido, que nace en PENDING.
 *   2. Pide aquí un cobro y recibe un `clientSecret`.
 *   3. Confirma el pago en su navegador, hablando con Stripe directamente.
 *   4. Stripe nos avisa por webhook de cómo acabó, y aquí se apunta todo.
 *
 * El paso 3 es el importante: los datos de la tarjeta van del navegador a
 * Stripe sin pasar por aquí. Este servidor nunca ve un número de tarjeta,
 * que es lo que evita tener que cumplir PCI por nuestra cuenta.
 *
 * La confirmación viene del webhook y no de lo que diga el cliente. Un
 * navegador puede decir «ya pagué» sin haber pagado; Stripe no.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeClient,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * Abre el cobro de un pedido y devuelve lo que el navegador necesita.
   *
   * Si ya había uno abierto para ese pedido, se devuelve el mismo en vez
   * de crear otro. Dos cobros vivos sobre un pedido es la receta para
   * cobrarle dos veces a alguien.
   */
  async createIntent(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId)
      throw new ForbiddenException('This order belongs to another account');
    if (order.status === 'CANCELLED') throw new BadRequestException('This order was cancelled');
    if (order.payment?.status === 'succeeded')
      throw new BadRequestException('This order is already paid');

    const amountCents = Math.round(Number(order.total) * 100);
    if (amountCents <= 0) throw new BadRequestException('This order has nothing to charge');

    let anteriorCancelado: string | null = null;

    if (order.payment?.stripeIntentId) {
      const existente = await this.stripe.getPaymentIntent(order.payment.stripeIntentId);

      if (existente.status === 'succeeded') {
        // Stripe ya cobró aunque aquí no constara: el webhook no llegó.
        // Se concilia y no se abre otro cobro, que sería cobrar dos veces.
        await this.markPaid(order.id, existente.id, existente.amount, existente.currency);
        throw new BadRequestException('This order is already paid');
      }

      if (existente.status !== 'canceled') {
        // Retomar el cobro abierto con su propio secreto, en vez de mandar a
        // la persona a pagar en barra porque «ya había uno».
        return {
          paymentIntentId: existente.id,
          clientSecret: existente.clientSecret,
          status: existente.status,
          reused: true,
        };
      }

      anteriorCancelado = existente.id;
    }

    const intent = await this.stripe.createPaymentIntent({
      amountCents,
      currency: CURRENCY,
      orderId: order.id,
      userId,
      // La llave es por intento, no solo por pedido. Dos clics seguidos
      // mandan la misma y Stripe devuelve un único cobro. Pero si el cobro
      // anterior se canceló, reutilizar `order_<id>` haría que Stripe
      // devolviera ese cobro cancelado otra vez durante 24 horas y el pedido
      // no se podría pagar nunca. Colgarla del cobro cancelado la hace
      // distinta y sigue siendo determinista.
      idempotencyKey: anteriorCancelado
        ? `order_${order.id}_after_${anteriorCancelado}`
        : `order_${order.id}`,
    });

    await this.prisma.payment.upsert({
      where: { orderId: order.id },
      update: { stripeIntentId: intent.id, status: intent.status, amount: order.total },
      create: {
        orderId: order.id,
        stripeIntentId: intent.id,
        status: intent.status,
        amount: order.total,
      },
    });

    return {
      paymentIntentId: intent.id,
      clientSecret: intent.clientSecret,
      status: intent.status,
      reused: false,
    };
  }

  /**
   * Procesa lo que Stripe nos cuenta. Todo lo que acaba en dinero se apunta.
   *
   * Tres garantías:
   *
   * 1. Un mismo evento se aplica una vez. Stripe reintenta un webhook hasta
   *    recibir 200 y el `evt_...` llega idéntico: si ya consta, se contesta
   *    que sí y no se toca nada.
   *
   * 2. Cada efecto es idempotente por sí mismo. Confirmar es una escritura
   *    condicional y los puntos tienen índice único, así que aunque un
   *    evento se colara dos veces no habría doble confirmación ni doble aviso
   *    de pago.
   *
   * 3. Queda rastro de todo: pagos buenos, fallidos, reembolsos y disputas.
   *    Es lo que permite contestar a «me cobrasteis y no me llegó el café»
   *    con datos y no con memoria.
   *
   * Lo que no entendemos se ignora en silencio: Stripe manda decenas de tipos
   * y reaccionar a los desconocidos es como se rompe un cobro que iba bien.
   *
   * ponytail: dos entregas simultáneas del mismo evento pasan las dos la
   * comprobación del punto 1. Stripe no suele solaparlas y los efectos del
   * punto 2 aguantan; si algún día duplica el aviso de pago fallido, el
   * registro se inserta antes de aplicar, dentro de la misma transacción.
   */
  async handleEvent(event: StripeEvent) {
    if (event.id) {
      const visto = await this.prisma.paymentEvent.findUnique({
        where: { stripeEventId: event.id },
        select: { id: true },
      });
      if (visto) return { handled: true, duplicate: true };
    }

    const obj = event.data?.object ?? {};
    const intentId = this.intentIdOf(event.type, obj);
    const orderId = await this.orderIdOf(obj, intentId);

    if (!orderId) {
      this.logger.warn(`Stripe event ${event.type} has no order attached. Ignored.`);
      return { handled: false };
    }

    const handled = await this.apply(event.type, obj, orderId);
    if (handled) await this.record(event, obj, orderId, intentId);
    return { handled };
  }

  /** De qué cobro habla el evento. Los de `charge` lo llevan en otro campo. */
  private intentIdOf(type: string, obj: Record<string, any>): string | null {
    if (type.startsWith('payment_intent.')) return obj.id ?? null;
    return obj.payment_intent ?? null;
  }

  /**
   * De qué pedido habla el evento.
   *
   * Los `payment_intent.*` lo traen en los metadatos. Los de `charge.*` y las
   * disputas no siempre: se busca por el cobro, que se guardó al abrirlo.
   */
  private async orderIdOf(
    obj: Record<string, any>,
    intentId: string | null,
  ): Promise<string | null> {
    const deMetadatos = obj.metadata?.orderId as string | undefined;
    if (deMetadatos) return deMetadatos;
    if (!intentId) return null;
    const pago = await this.prisma.payment.findUnique({
      where: { stripeIntentId: intentId },
      select: { orderId: true },
    });
    return pago?.orderId ?? null;
  }

  /** Aplica un evento. Devuelve si era de los que nos importan. */
  private async apply(type: string, obj: Record<string, any>, orderId: string): Promise<boolean> {
    switch (type) {
      case 'payment_intent.succeeded':
        await this.markPaid(orderId, obj.id, obj.amount_received ?? obj.amount, obj.currency);
        return true;

      case 'payment_intent.processing':
      case 'payment_intent.requires_action':
        // Un banco que tarda o que pide 3-D Secure. No es un fallo: se apunta
        // para que la caja no lo dé por perdido.
        await this.setStatus(orderId, obj.status);
        return true;

      case 'payment_intent.payment_failed': {
        const err = obj.last_payment_error ?? {};
        await this.prisma.payment.updateMany({
          where: { orderId },
          data: {
            status: obj.status ?? 'requires_payment_method',
            failureCode: err.decline_code ?? err.code ?? null,
            failureMessage: err.message ?? null,
          },
        });
        this.logger.warn(
          `Payment for order ${orderId} failed: ${err.decline_code ?? err.code ?? 'unknown'}`,
        );

        // El pedido sigue en pie: se puede pagar con otra tarjeta o en barra.
        // Se avisa para que nadie se presente creyendo que ya está pagado.
        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
          select: { userId: true },
        });
        if (order) {
          this.events.emit(EVENTS.paymentFailed, {
            orderId,
            userId: order.userId,
            reason: err.message ?? null,
          } satisfies PaymentFailedEvent);
        }
        return true;
      }

      case 'payment_intent.canceled':
        await this.setStatus(orderId, 'canceled');
        return true;

      case 'charge.succeeded':
        // El cobro con tarjeta dice con qué se pagó de verdad: una tarjeta
        // suelta, o una tarjeta dentro de Apple Pay, Google Pay o Link.
        await this.prisma.payment.updateMany({
          where: { orderId },
          data: { method: methodOf(obj) },
        });
        return true;

      case 'charge.refunded': {
        const devuelto = Math.round(obj.amount_refunded ?? 0) / 100;
        const completo = obj.refunded === true;
        await this.prisma.payment.updateMany({
          where: { orderId },
          data: {
            amountRefunded: devuelto,
            status: completo ? 'refunded' : 'partially_refunded',
          },
        });
        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
          select: { userId: true },
        });
        if (order) {
          this.events.emit(EVENTS.paymentRefunded, {
            orderId,
            userId: order.userId,
            amount: devuelto,
            full: completo,
          } satisfies PaymentRefundedEvent);
        }
        return true;
      }

      case 'charge.dispute.created':
        // Una disputa cuesta dinero y tiene plazo para responder. Se marca
        // y se registra como error para que se vea en el log.
        await this.setStatus(orderId, 'disputed');
        this.logger.error(`Dispute opened on order ${orderId}: ${obj.reason ?? 'no reason given'}`);
        return true;

      default:
        return false;
    }
  }

  /** El rastro de un evento ya aplicado. */
  private async record(
    event: StripeEvent,
    obj: Record<string, any>,
    orderId: string,
    intentId: string | null,
  ) {
    if (!event.id) return;
    const err = obj.last_payment_error ?? {};
    try {
      await this.prisma.paymentEvent.create({
        data: {
          stripeEventId: event.id,
          type: event.type,
          orderId,
          intentId,
          status: obj.status ?? null,
          amount: typeof obj.amount === 'number' ? obj.amount : null,
          currency: obj.currency ?? null,
          failureCode: err.decline_code ?? err.code ?? null,
          failureMessage: err.message ?? null,
        },
      });
    } catch (e) {
      // Otro proceso lo apuntó a la vez. Ya consta, que es lo que importa.
      if (!esDuplicado(e)) throw e;
    }
  }

  /**
   * Da el pedido por pagado y lo confirma. Una sola vez, pase lo que pase.
   *
   * Dos caminos llegan aquí a la vez con facilidad: el webhook de Stripe y
   * la conciliación que dispara el navegador al terminar de pagar. Leer
   * «está PENDING» y luego escribir «CONFIRMED» en dos pasos deja que los
   * dos lo lean PENDING, los dos confirmen y el cliente reciba dos correos.
   *
   * Así que la confirmación es una escritura condicional dentro de una
   * transacción: `UPDATE ... WHERE status = 'PENDING'`. La base solo deja que
   * una la haga; la otra afecta a cero filas y no anuncia nada.
   *
   * Y antes de dar nada por pagado se comprueba que Stripe cobró lo que vale
   * el pedido y en nuestra moneda. Un cobro de otro importe no confirma un
   * pedido, aunque traiga su id en los metadatos.
   */
  private async markPaid(
    orderId: string,
    intentId: string,
    amountCents?: number,
    currency?: string,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      this.logger.error(`Stripe charged order ${orderId}, which does not exist here.`);
      return;
    }

    const esperado = Math.round(Number(order.total) * 100);
    if (amountCents !== undefined && amountCents !== esperado) {
      this.logger.error(
        `Charge ${intentId} of ${amountCents} for order ${orderId}, which is worth ${esperado}. Not confirmed.`,
      );
      return;
    }
    if (currency && currency.toLowerCase() !== CURRENCY) {
      this.logger.error(`Charge ${intentId} in ${currency}; expected ${CURRENCY}. Not confirmed.`);
      return;
    }

    const confirmado = await serializable(this.prisma, async (tx) => {
      await tx.payment.upsert({
        where: { orderId },
        update: {
          status: 'succeeded',
          paidAt: new Date(),
          stripeIntentId: intentId,
          // Un intento fallido anterior ya no describe este cobro.
          failureCode: null,
          failureMessage: null,
        },
        create: {
          orderId,
          stripeIntentId: intentId,
          status: 'succeeded',
          amount: order.total,
          paidAt: new Date(),
        },
      });

      const { count } = await tx.order.updateMany({
        where: { id: orderId, status: 'PENDING' },
        data: { status: 'CONFIRMED' },
      });
      if (count === 0) return false;

      await tx.orderStatusHistory.create({
        data: { orderId, status: 'CONFIRMED', note: 'Payment received' },
      });
      return true;
    });

    // Solo quien ganó la escritura anuncia, y fuera de la transacción: un
    // aviso que sale y luego se deshace es peor que uno que no sale.
    if (!confirmado) return;

    this.events.emit(EVENTS.orderStatusChanged, {
      orderId,
      userId: order.userId,
      status: 'CONFIRMED',
      total: Number(order.total),
    } satisfies OrderStatusChangedEvent);

    this.logger.log(`Order ${orderId} paid and confirmed`);
  }

  private async setStatus(orderId: string, status: StripeStatus) {
    await this.prisma.payment.updateMany({ where: { orderId }, data: { status } });
    this.logger.warn(`Payment for order ${orderId} is now ${status}`);
  }

  /**
   * Lo que el cliente ve de su propio cobro.
   *
   * Antes de responder se reconcilia contra Stripe cuando aquí consta sin
   * pagar pero hay un cobro abierto. El webhook sigue siendo el camino
   * normal; esto cubre los dos casos en que no llega: en local, sin
   * `stripe listen`, y en producción cuando Stripe tarda en reintentar.
   *
   * Quien decide sigue siendo Stripe: se le pregunta a él, no al navegador,
   * así que un cliente no puede darse por pagado.
   */
  async statusFor(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId)
      throw new ForbiddenException('This order belongs to another account');

    if (order.payment?.stripeIntentId && order.payment.status !== 'succeeded') {
      const real = await this.stripe
        .getPaymentIntent(order.payment.stripeIntentId)
        .catch(() => null);

      if (real?.status === 'succeeded') {
        // markPaid es idempotente, así que da igual que el webhook llegue
        // después: el segundo en enterarse no hace nada.
        await this.markPaid(orderId, real.id, real.amount, real.currency);
        return this.statusFor(orderId, userId);
      }
      if (real && real.status !== order.payment.status) {
        await this.setStatus(orderId, real.status);
      }
    }

    return {
      orderId,
      orderStatus: order.status,
      paid: order.payment?.status === 'succeeded',
      paymentStatus: order.payment?.status ?? 'no charge opened',
      method: order.payment?.method ?? null,
      failureMessage: order.payment?.failureMessage ?? null,
      amountRefunded: Number(order.payment?.amountRefunded ?? 0),
      paidAt: order.payment?.paidAt ?? null,
      amount: order.payment?.amount ?? order.total,
    };
  }
}

/**
 * Con qué se pagó, a partir de un cargo de Stripe.
 *
 * Apple Pay y Google Pay son, por dentro, una tarjeta: Stripe los reporta
 * como `card` con una cartera dentro. Lo que le interesa a la caja es la
 * cartera, así que se prefiere esa.
 */
export function methodOf(charge: Record<string, any>): string | null {
  const detalles = charge.payment_method_details;
  return detalles?.card?.wallet?.type ?? detalles?.type ?? null;
}
