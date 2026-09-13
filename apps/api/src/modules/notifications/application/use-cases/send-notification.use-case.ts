import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IMailer, MAILER } from '../../domain/ports/mailer.port';
import type { Message } from '../../domain/templates';
import { renderEmail } from '../../domain/email-layout';
import { PushSender } from '../../infrastructure/push/push.sender';
import { SmsSender } from '../../infrastructure/sms/sms.sender';

export type NotificationType = 'ACCOUNT' | 'ORDER' | 'RESERVATION' | 'LOYALTY' | 'MARKETING';

export interface SendInput {
  userId: string;
  type: NotificationType;
  message: Message;
  /** A qué pedido apunta, cuando apunta a alguno. */
  orderId?: string;
  /** Por omisión: correo y cuenta. Push y SMS hay que pedirlos. */
  channels?: { email?: boolean; inApp?: boolean; push?: boolean; sms?: boolean };
  /** A dónde lleva el toque en el aviso push. */
  url?: string;
}

/**
 * Manda un aviso por las dos vías.
 *
 * Vía 1, el correo: llega aunque la persona no tenga la app abierta.
 * Vía 2, la cuenta: queda guardado para leerlo después.
 *
 * Dos reglas que no son negociables:
 *
 * Un aviso de publicidad solo sale si la persona dio su consentimiento.
 * Los avisos de un pedido o una reserva salen siempre, porque son parte
 * del servicio que la persona pidió, no publicidad.
 *
 * Y si el correo falla, el aviso en la cuenta ya quedó guardado. Un
 * proveedor caído no puede tumbar el pedido que lo provocó, así que
 * aquí se registra el fallo y se sigue.
 */
@Injectable()
export class SendNotificationUseCase {
  private readonly logger = new Logger(SendNotificationUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAILER) private readonly mailer: IMailer,
    private readonly push: PushSender,
    private readonly sms: SmsSender,
  ) {}

  async execute(input: SendInput): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, phone: true, marketingOptIn: true },
    });
    if (!user) {
      this.logger.warn(`Aviso descartado: el usuario ${input.userId} no existe`);
      return;
    }

    if (input.type === 'MARKETING' && !user.marketingOptIn) return;

    const wantsEmail = input.channels?.email ?? true;
    const wantsInApp = input.channels?.inApp ?? true;
    // Push y SMS no salen por omisión. El primero solo sirve si la persona
    // dio permiso en el navegador; el segundo cuesta dinero por mensaje.
    // Los pide quien manda el aviso, y solo para lo que de verdad urge.
    const wantsPush = input.channels?.push ?? false;
    const wantsSms = input.channels?.sms ?? false;

    if (wantsInApp) {
      await this.prisma.notification.create({
        data: {
          userId: input.userId,
          channel: 'EMAIL',
          type: input.type,
          title: input.message.title,
          body: input.message.body,
          orderId: input.orderId,
        },
      });
    }

    if (wantsEmail) {
      try {
        await this.mailer.send({
          to: user.email,
          subject: input.message.title,
          // Los dos: el HTML es lo que se ve, y el texto es lo que lee
          // quien bloquea el marcado. Mandar solo HTML es media razón por
          // la que un correo acaba en spam.
          text: input.message.body,
          html: renderEmail(input.message.title, input.message.body),
        });
      } catch (error) {
        this.logger.error(`Could not send email to ${user.email}: ${(error as Error).message}`);
      }
    }

    if (wantsPush) {
      // El propio PushSender se traga sus fallos y limpia las suscripciones
      // muertas, así que aquí no hace falta envolverlo en otro try.
      await this.push.sendToUser(input.userId, {
        title: input.message.title,
        body: input.message.body,
        url: input.url,
      });
    }

    if (wantsSms && user.phone) {
      // Título y cuerpo juntos: un SMS no tiene asunto, y mandar solo el
      // cuerpo deja avisos que empiezan a media frase.
      await this.sms.send(user.phone, `${input.message.title}. ${input.message.body}`);
    }
  }
}
