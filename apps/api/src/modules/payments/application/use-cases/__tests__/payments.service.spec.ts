import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from '../payments.service';

const ORDEN = {
  id: 'ord-1',
  userId: 'u1',
  status: 'PENDING',
  total: 12.5,
  payment: null as any,
};

describe('PaymentsService', () => {
  let prisma: any;
  let stripe: any;
  let events: { emit: jest.Mock };
  let service: PaymentsService;

  beforeEach(() => {
    prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({ ...ORDEN }),
        update: jest.fn().mockResolvedValue({ ...ORDEN, status: 'CONFIRMED' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      payment: {
        upsert: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      paymentEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    };
    // La transacción corre la función con el mismo cliente falso.
    prisma.$transaction = jest.fn((fn: (tx: unknown) => unknown) => fn(prisma));
    stripe = {
      createPaymentIntent: jest
        .fn()
        .mockResolvedValue({
          id: 'pi_1',
          clientSecret: 'pi_1_secret',
          status: 'requires_payment_method',
        }),
      getPaymentIntent: jest.fn(),
    };
    events = { emit: jest.fn() };
    service = new PaymentsService(prisma, stripe, events as any);
  });

  describe('createIntent', () => {
    it('convierte el total a centavos enteros', async () => {
      // Mandar 12.5 en vez de 1250 cobraria doce centavos, y eso no se
      // descubre hasta que alguien revisa la caja.
      await service.createIntent('ord-1', 'u1');
      expect(stripe.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({ amountCents: 1250, currency: 'cad' }),
      );
    });

    it('usa una llave de idempotencia por pedido', async () => {
      // Un doble clic no puede abrir dos cobros sobre el mismo pedido.
      await service.createIntent('ord-1', 'u1');
      expect(stripe.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: 'order_ord-1' }),
      );
    });

    it('no deja abrir el cobro de un pedido ajeno', async () => {
      await expect(service.createIntent('ord-1', 'otro')).rejects.toThrow(ForbiddenException);
      expect(stripe.createPaymentIntent).not.toHaveBeenCalled();
    });

    it('no cobra dos veces un pedido ya pagado', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...ORDEN,
        payment: { status: 'succeeded', stripeIntentId: 'pi_1' },
      });
      await expect(service.createIntent('ord-1', 'u1')).rejects.toThrow(BadRequestException);
      expect(stripe.createPaymentIntent).not.toHaveBeenCalled();
    });

    it('no cobra un pedido cancelado', async () => {
      prisma.order.findUnique.mockResolvedValue({ ...ORDEN, status: 'CANCELLED' });
      await expect(service.createIntent('ord-1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('reutiliza el cobro que ya estaba abierto', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...ORDEN,
        payment: { status: 'requires_payment_method', stripeIntentId: 'pi_viejo' },
      });
      stripe.getPaymentIntent.mockResolvedValue({
        id: 'pi_viejo',
        status: 'processing',
        amount: 1250,
      });

      const out = await service.createIntent('ord-1', 'u1');
      expect(out.reused).toBe(true);
      expect(stripe.createPaymentIntent).not.toHaveBeenCalled();
    });

    it('abre uno nuevo si el anterior se cancelo', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...ORDEN,
        payment: { status: 'canceled', stripeIntentId: 'pi_viejo' },
      });
      stripe.getPaymentIntent.mockResolvedValue({
        id: 'pi_viejo',
        status: 'canceled',
        amount: 1250,
      });

      const out = await service.createIntent('ord-1', 'u1');
      expect(out.reused).toBe(false);
      expect(stripe.createPaymentIntent).toHaveBeenCalled();
    });

    it('no cobra un total de cero', async () => {
      prisma.order.findUnique.mockResolvedValue({ ...ORDEN, total: 0 });
      await expect(service.createIntent('ord-1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('falla si el pedido no existe', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.createIntent('fantasma', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleEvent', () => {
    const evento = (type: string, extra: Record<string, any> = {}) => ({
      type,
      data: { object: { id: 'pi_1', metadata: { orderId: 'ord-1' }, ...extra } },
    });

    it('confirma el pedido cuando el pago entra', async () => {
      const out = await service.handleEvent(evento('payment_intent.succeeded'));

      expect(out.handled).toBe(true);
      expect(prisma.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
          data: { status: 'CONFIRMED' },
        }),
      );
      expect(events.emit).toHaveBeenCalledWith(
        'order.status-changed',
        expect.objectContaining({ orderId: 'ord-1', status: 'CONFIRMED' }),
      );
    });

    it('aguanta el mismo aviso dos veces sin confirmar dos veces', async () => {
      // La escritura condicional encuentra el pedido fuera de PENDING y
      // afecta a cero filas: eso es lo que impide confirmar dos veces.
      prisma.order.updateMany.mockResolvedValue({ count: 0 });
      // Stripe reintenta hasta recibir un 200, asi que el mismo aviso
      // llega varias veces. Sin esto el cliente recibe tres correos.
      prisma.order.findUnique.mockResolvedValue({
        ...ORDEN,
        payment: { status: 'succeeded' },
      });

      await service.handleEvent(evento('payment_intent.succeeded'));

      expect(prisma.orderStatusHistory.create).not.toHaveBeenCalled();
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('no reabre un pedido que ya avanzo', async () => {
      // La escritura condicional encuentra el pedido fuera de PENDING y
      // afecta a cero filas: eso es lo que impide confirmar dos veces.
      prisma.order.updateMany.mockResolvedValue({ count: 0 });
      prisma.order.findUnique.mockResolvedValue({ ...ORDEN, status: 'READY' });
      await service.handleEvent(evento('payment_intent.succeeded'));
      expect(prisma.orderStatusHistory.create).not.toHaveBeenCalled();
    });

    it('apunta el fallo sin tocar el pedido', async () => {
      const out = await service.handleEvent(
        evento('payment_intent.payment_failed', { status: 'requires_payment_method' }),
      );
      expect(out.handled).toBe(true);
      expect(prisma.payment.updateMany).toHaveBeenCalled();
      expect(prisma.orderStatusHistory.create).not.toHaveBeenCalled();
    });

    it('ignora los eventos que no le tocan', async () => {
      // Stripe manda decenas de tipos. Reaccionar a los que no entendemos
      // es como se rompe un cobro que iba bien.
      const out = await service.handleEvent(evento('charge.updated'));
      expect(out.handled).toBe(false);
      expect(prisma.orderStatusHistory.create).not.toHaveBeenCalled();
    });

    it('ignora un evento sin orderId en vez de reventar', async () => {
      const out = await service.handleEvent({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_suelto' } },
      });
      expect(out.handled).toBe(false);
    });
  });

  describe('statusFor — reconciliacion con Stripe', () => {
    it('confirma el pedido si Stripe dice pagado aunque el webhook no llegara', async () => {
      // Es el caso de local sin `stripe listen`, y el de un webhook que
      // Stripe reintenta tarde. Sin esto el pedido se queda en PENDING con
      // la tarjeta ya cobrada.
      const pendiente = {
        ...ORDEN,
        payment: { status: 'requires_payment_method', stripeIntentId: 'pi_1' },
      };
      const pagado = {
        ...ORDEN,
        status: 'CONFIRMED',
        payment: { status: 'succeeded', stripeIntentId: 'pi_1', paidAt: new Date() },
      };
      prisma.order.findUnique
        .mockResolvedValueOnce(pendiente) // la lectura de statusFor
        .mockResolvedValueOnce(pendiente) // la de markPaid
        .mockResolvedValue(pagado); // la relectura
      stripe.getPaymentIntent.mockResolvedValue({ id: 'pi_1', status: 'succeeded' });

      const res = await service.statusFor('ord-1', 'u1');

      expect(res.paid).toBe(true);
      expect(prisma.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
          data: { status: 'CONFIRMED' },
        }),
      );
    });

    it('no da por pagado lo que Stripe dice que no lo esta', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...ORDEN,
        payment: { status: 'requires_payment_method', stripeIntentId: 'pi_1' },
      });
      stripe.getPaymentIntent.mockResolvedValue({ id: 'pi_1', status: 'requires_payment_method' });

      const res = await service.statusFor('ord-1', 'u1');

      expect(res.paid).toBe(false);
      expect(prisma.orderStatusHistory.create).not.toHaveBeenCalled();
    });
  });

  describe('blindaje del cobro', () => {
    it('no confirma un cobro de otro importe aunque traiga el id del pedido', async () => {
      // ORDEN vale 12.50: un cobro de 1 centavo con sus metadatos no puede
      // darlo por pagado.
      await service.handleEvent({
        type: 'payment_intent.succeeded',
        data: {
          object: { id: 'pi_x', amount: 1, currency: 'cad', metadata: { orderId: 'ord-1' } },
        },
      });
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('no confirma un cobro en otra moneda', async () => {
      await service.handleEvent({
        type: 'payment_intent.succeeded',
        data: {
          object: { id: 'pi_x', amount: 1250, currency: 'usd', metadata: { orderId: 'ord-1' } },
        },
      });
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('retoma el cobro abierto con su secreto en vez de mandar a pagar en barra', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...ORDEN,
        payment: { status: 'requires_payment_method', stripeIntentId: 'pi_1' },
      });
      stripe.getPaymentIntent.mockResolvedValue({
        id: 'pi_1',
        status: 'requires_payment_method',
        amount: 1250,
        currency: 'cad',
        clientSecret: 'pi_1_secret_abc',
      });

      const r = await service.createIntent('ord-1', 'u1');

      expect(r.clientSecret).toBe('pi_1_secret_abc');
      expect(stripe.createPaymentIntent).not.toHaveBeenCalled();
    });

    it('tras un cobro cancelado usa otra llave, o Stripe devolvería el cancelado', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...ORDEN,
        payment: { status: 'canceled', stripeIntentId: 'pi_viejo' },
      });
      stripe.getPaymentIntent.mockResolvedValue({
        id: 'pi_viejo',
        status: 'canceled',
        amount: 1250,
        currency: 'cad',
        clientSecret: null,
      });

      await service.createIntent('ord-1', 'u1');

      expect(stripe.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: 'order_ord-1_after_pi_viejo' }),
      );
    });

    it('si Stripe ya cobró y aquí no constaba, concilia y no abre otro cobro', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...ORDEN,
        payment: { status: 'requires_payment_method', stripeIntentId: 'pi_1' },
      });
      stripe.getPaymentIntent.mockResolvedValue({
        id: 'pi_1',
        status: 'succeeded',
        amount: 1250,
        currency: 'cad',
        clientSecret: null,
      });

      await expect(service.createIntent('ord-1', 'u1')).rejects.toThrow(BadRequestException);
      expect(stripe.createPaymentIntent).not.toHaveBeenCalled();
      expect(prisma.order.updateMany).toHaveBeenCalled();
    });
  });

  describe('webhook: cada resultado queda apuntado', () => {
    const conId = (id: string, type: string, object: Record<string, any>) => ({
      id,
      type,
      data: { object },
    });

    it('un evento ya procesado no se aplica otra vez', async () => {
      // Stripe reintenta el mismo evt_ hasta recibir 200.
      prisma.paymentEvent.findUnique.mockResolvedValue({ id: 'ya' });
      const out = await service.handleEvent(
        conId('evt_1', 'payment_intent.succeeded', { id: 'pi_1', metadata: { orderId: 'ord-1' } }),
      );
      expect(out).toEqual({ handled: true, duplicate: true });
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
      expect(prisma.paymentEvent.create).not.toHaveBeenCalled();
    });

    it('un pago fallido guarda el motivo, avisa y deja rastro', async () => {
      const out = await service.handleEvent(
        conId('evt_2', 'payment_intent.payment_failed', {
          id: 'pi_1',
          status: 'requires_payment_method',
          metadata: { orderId: 'ord-1' },
          last_payment_error: {
            code: 'card_declined',
            decline_code: 'insufficient_funds',
            message: 'Your card has insufficient funds.',
          },
        }),
      );
      expect(out.handled).toBe(true);
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failureCode: 'insufficient_funds',
            failureMessage: 'Your card has insufficient funds.',
          }),
        }),
      );
      expect(events.emit).toHaveBeenCalledWith(
        'payment.failed',
        expect.objectContaining({ orderId: 'ord-1', reason: 'Your card has insufficient funds.' }),
      );
      expect(prisma.paymentEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stripeEventId: 'evt_2',
            failureCode: 'insufficient_funds',
          }),
        }),
      );
    });

    it('un cargo sin metadatos encuentra el pedido por su cobro', async () => {
      // Los eventos charge.* no siempre traen el orderId.
      prisma.payment.findUnique.mockResolvedValue({ orderId: 'ord-1' });
      const out = await service.handleEvent(
        conId('evt_3', 'charge.succeeded', {
          id: 'ch_1',
          payment_intent: 'pi_1',
          payment_method_details: { type: 'card', card: { wallet: { type: 'apple_pay' } } },
        }),
      );
      expect(out.handled).toBe(true);
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { orderId: 'ord-1' }, data: { method: 'apple_pay' } }),
      );
    });

    it('un reembolso completo marca el cobro y avisa', async () => {
      prisma.payment.findUnique.mockResolvedValue({ orderId: 'ord-1' });
      await service.handleEvent(
        conId('evt_4', 'charge.refunded', {
          id: 'ch_1',
          payment_intent: 'pi_1',
          amount_refunded: 1250,
          refunded: true,
        }),
      );
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { amountRefunded: 12.5, status: 'refunded' } }),
      );
      expect(events.emit).toHaveBeenCalledWith(
        'payment.refunded',
        expect.objectContaining({ amount: 12.5, full: true }),
      );
    });

    it('un reembolso parcial no se da por completo', async () => {
      prisma.payment.findUnique.mockResolvedValue({ orderId: 'ord-1' });
      await service.handleEvent(
        conId('evt_5', 'charge.refunded', {
          id: 'ch_1',
          payment_intent: 'pi_1',
          amount_refunded: 500,
          refunded: false,
        }),
      );
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { amountRefunded: 5, status: 'partially_refunded' } }),
      );
    });

    it('una disputa marca el cobro', async () => {
      prisma.payment.findUnique.mockResolvedValue({ orderId: 'ord-1' });
      const out = await service.handleEvent(
        conId('evt_6', 'charge.dispute.created', {
          id: 'dp_1',
          payment_intent: 'pi_1',
          reason: 'fraudulent',
        }),
      );
      expect(out.handled).toBe(true);
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'disputed' } }),
      );
    });

    it('un banco que tarda queda como procesando, no como fallido', async () => {
      await service.handleEvent(
        conId('evt_7', 'payment_intent.processing', {
          id: 'pi_1',
          status: 'processing',
          metadata: { orderId: 'ord-1' },
        }),
      );
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'processing' } }),
      );
      expect(events.emit).not.toHaveBeenCalled();
    });
  });
});
