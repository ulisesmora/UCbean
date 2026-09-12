import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IMailer, MAILER } from '../../domain/ports/mailer.port';
import type { Message } from '../../domain/templates';

export type NotificationType = 'ACCOUNT' | 'ORDER' | 'RESERVATION' | 'LOYALTY' | 'MARKETING';

export interface SendInput {
  userId: string;
  type: NotificationType;
  message: Message;
  /** A qué pedido apunta, cuando apunta a alguno. */
  orderId?: string;
  /** Por omisión sale por las dos vías. */
  channels?: { email?: boolean; inApp?: boolean };
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
  ) {}

  async execute(input: SendInput): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, marketingOptIn: true },
    });
    if (!user) {
      this.logger.warn(`Aviso descartado: el usuario ${input.userId} no existe`);
      return;
    }

    if (input.type === 'MARKETING' && !user.marketingOptIn) return;

    const wantsEmail = input.channels?.email ?? true;
    const wantsInApp = input.channels?.inApp ?? true;

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
          text: input.message.body,
        });
      } catch (error) {
        this.logger.error(
          `No se pudo enviar el correo a ${user.email}: ${(error as Error).message}`,
        );
      }
    }
  }
}
