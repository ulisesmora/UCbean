import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Stripe, sin SDK.
 *
 * Solo se usan dos llamadas y la API de Stripe es HTTP con el cuerpo
 * codificado como formulario. Node 22 ya trae `fetch`, así que meter un
 * SDK de varios megas para esto añade una dependencia que hay que ir
 * actualizando durante años a cambio de nada. Misma decisión que con
 * Resend, y por el mismo motivo.
 *
 * Si algún día hacen falta suscripciones, facturas o Connect, ahí sí
 * vale la pena el paquete `stripe` y este archivo se tira.
 */
@Injectable()
export class StripeClient {
  private readonly logger = new Logger(StripeClient.name);
  private readonly key: string | undefined;

  constructor(config: ConfigService) {
    this.key = config.get<string>('STRIPE_SECRET_KEY');

    if (!this.key) {
      // Sin llave el módulo carga igual y todo lo demás sigue en pie. Solo
      // falla quien intente cobrar, y con un mensaje que dice por qué. Si
      // esto tumbara el arranque, no tener Stripe configurado dejaría el
      // menú y los pedidos fuera de servicio.
      if (config.get<string>('NODE_ENV') === 'production') {
        throw new Error('STRIPE_SECRET_KEY is missing. Production must be able to take payments.');
      }
      this.logger.warn('Sin STRIPE_SECRET_KEY: el cobro está apagado.');
    }
  }

  /** Lanza con un mensaje claro en vez de un 401 críptico de Stripe. */
  private requireKey(): string {
    if (!this.key) {
      throw new ServiceUnavailableException(
        'Card payments are not set up yet. STRIPE_SECRET_KEY is missing.',
      );
    }
    return this.key;
  }

  /** Si se puede cobrar, para que el resto del sistema lo sepa. */
  get enabled(): boolean {
    return Boolean(this.key);
  }

  /**
   * Abre un cobro.
   *
   * El importe va en centavos y en entero, que es como Stripe cuenta el
   * dinero. Mandar 12.5 en vez de 1250 cobra doce centavos, y el error no
   * se ve hasta que alguien revisa la caja.
   */
  async createPaymentIntent(input: {
    amountCents: number;
    currency: string;
    orderId: string;
    userId: string;
    /** Evita cobrar dos veces si el cliente da doble clic. */
    idempotencyKey: string;
  }): Promise<{ id: string; clientSecret: string; status: string }> {
    const body = new URLSearchParams({
      amount: String(input.amountCents),
      currency: input.currency,
      'automatic_payment_methods[enabled]': 'true',
      'metadata[orderId]': input.orderId,
      'metadata[userId]': input.userId,
    });

    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.requireKey()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        // Stripe reconoce esta cabecera: repetir la misma llave devuelve
        // el cobro que ya existía en vez de abrir uno nuevo.
        'Idempotency-Key': input.idempotencyKey,
      },
      body,
    });

    const json = (await res.json()) as Record<string, any>;
    if (!res.ok) {
      const detalle = json?.error?.message ?? `HTTP ${res.status}`;
      throw new Error(`Stripe rejected the payment: ${detalle}`);
    }

    return { id: json.id, clientSecret: json.client_secret, status: json.status };
  }

  /** Consulta el estado de un cobro, para reconciliar sin esperar al webhook. */
  async getPaymentIntent(id: string): Promise<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    clientSecret: string | null;
  }> {
    const res = await fetch(`https://api.stripe.com/v1/payment_intents/${id}`, {
      headers: { Authorization: `Bearer ${this.requireKey()}` },
    });
    const json = (await res.json()) as Record<string, any>;
    if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
    // Con la llave secreta Stripe sí devuelve el client_secret al consultar.
    // Es lo que permite retomar un cobro abierto en vez de mandar a la
    // persona a pagar en barra porque «ya había uno».
    return {
      id: json.id,
      status: json.status,
      amount: json.amount,
      currency: json.currency,
      clientSecret: json.client_secret ?? null,
    };
  }

  /** Devuelve el dinero de un pedido cancelado. */
  async refund(paymentIntentId: string): Promise<void> {
    const res = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.requireKey()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ payment_intent: paymentIntentId }),
    });
    if (!res.ok) {
      const json = (await res.json()) as Record<string, any>;
      throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
    }
    this.logger.log(`Reembolso emitido para ${paymentIntentId}`);
  }
}
