import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

// `web-push` es CommonJS y no trae export por defecto: el import ES deja
// la variable en undefined y revienta al arrancar. Igual que con sharp, se
// carga con require y se le pone el tipo a mano.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const webpush = require('web-push') as typeof import('web-push');

/** Lo que llega al aparato. Corto: una notificación no es un correo. */
export interface PushPayload {
  title: string;
  body: string;
  /** A dónde lleva el toque. Normalmente el seguimiento del pedido. */
  url?: string;
}

/**
 * El aviso que suena en el bolsillo.
 *
 * Web Push cifra el contenido de punta a punta con las claves que dio el
 * navegador al suscribirse, así que ni Google ni Apple pueden leer lo que
 * mandamos. Eso es también la razón de usar `web-push` en vez de hablar con
 * el endpoint a mano como hacemos con Resend o Stripe: aquí hay ECDH, HKDF
 * y AES-GCM de por medio, y la criptografía no se escribe a mano.
 *
 * Sin claves VAPID el servicio se queda callado y lo dice una vez al
 * arrancar, igual que el correo sin Resend. Así se puede trabajar en local
 * sin configurar nada.
 */
@Injectable()
export class PushSender {
  private readonly logger = new Logger('Push');
  private readonly activo: boolean;

  constructor(private readonly prisma: PrismaService) {
    const publica = process.env.VAPID_PUBLIC_KEY;
    const privada = process.env.VAPID_PRIVATE_KEY;
    // El «subject» identifica a quién reclamar si abusamos del servicio.
    // Tiene que ser una URL o un mailto:, no un nombre.
    const contacto = process.env.VAPID_SUBJECT ?? 'mailto:hola@aroundthebean.ca';

    this.activo = Boolean(publica && privada);
    if (this.activo) {
      webpush.setVapidDetails(contacto, publica!, privada!);
    } else {
      this.logger.warn(
        'Sin claves VAPID: los avisos push no salen. Genera unas con pnpm push:keys',
      );
    }
  }

  /**
   * Manda a todos los aparatos de una persona.
   *
   * Una suscripción muerta —desinstaló la app, limpió el navegador— se
   * borra en cuanto el servicio devuelve 404 o 410. Si no, la lista crece
   * para siempre y cada aviso tarda más que el anterior.
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<number> {
    if (!this.activo) return 0;

    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    if (subs.length === 0) return 0;

    let entregados = 0;

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
          );
          entregados++;
          await this.prisma.pushSubscription.update({
            where: { id: s.id },
            data: { lastUsedAt: new Date() },
          });
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await this.prisma.pushSubscription
              .delete({ where: { id: s.id } })
              .catch(() => undefined);
            return;
          }
          // Cualquier otro fallo se registra y ya está: un aviso que no
          // llega no puede tumbar el pedido que lo provocó.
          this.logger.error(
            `Push a ${s.endpoint.slice(0, 40)}… falló: ${(error as Error).message}`,
          );
        }
      }),
    );

    return entregados;
  }
}
