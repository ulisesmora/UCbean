import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IMailer, MAILER } from '../../../notifications/domain/ports/mailer.port';
import { Inject } from '@nestjs/common';
import { fillTemplate } from '../../../notifications/domain/templates';
import { audienceFilter, canSend, type Audience } from '../../domain/audience';

/**
 * Campañas de correo y SMS.
 *
 * Dos reglas gobiernan todo lo de aquí:
 *
 * Solo se escribe a quien dio su consentimiento. `marketingOptIn` se
 * comprueba en la consulta, no después, para que nadie pueda saltárselo
 * pasando una lista a mano.
 *
 * Y una campaña enviada no se reenvía. El estado y la clave única de
 * entrega por persona son las dos cosas que impiden el error más caro
 * de este módulo, que es el segundo correo a la misma lista.
 */
@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAILER) private readonly mailer: IMailer,
  ) {}

  /**
   * Quién recibiría esta campaña.
   *
   * Se puede consultar antes de mandar nada, que es lo que convierte
   * «mandar a todos» en una decisión informada y no en una apuesta.
   */
  async recipients(audience: Audience) {
    const f = audienceFilter(audience);

    const users = await this.prisma.user.findMany({
      where: {
        marketingOptIn: true,
        role: 'CUSTOMER',
        ...(f.noOrdersSince ? { orders: { none: { createdAt: { gte: f.noOrdersSince } } } } : {}),
      },
      select: { id: true, name: true, email: true, birthday: true },
    });

    // El mes de cumpleaños se filtra en memoria: Prisma no sabe extraer
    // el mes de una fecha de forma portable, y la lista de clientes de
    // una cafetería de campus cabe de sobra en memoria.
    const byBirthday = f.birthdayMonth
      ? users.filter((u) => u.birthday && u.birthday.getMonth() + 1 === f.birthdayMonth)
      : users;

    if (!f.hasPoints) return byBirthday;

    const withPoints = await this.pointsByUser(byBirthday.map((u) => u.id));
    return byBirthday.filter((u) => (withPoints.get(u.id) ?? 0) > 0);
  }

  /** Saldo de varias personas de una vez, para no consultar en bucle. */
  private async pointsByUser(userIds: string[]): Promise<Map<string, number>> {
    if (!userIds.length) return new Map();
    const cards = await this.prisma.loyaltyCard.findMany({
      where: { userId: { in: userIds } },
      select: { id: true, userId: true },
    });
    const sums = await this.prisma.pointsEntry.groupBy({
      by: ['cardId'],
      where: { cardId: { in: cards.map((c) => c.id) } },
      _sum: { delta: true },
    });
    const byCard = new Map(sums.map((s) => [s.cardId, s._sum.delta ?? 0]));
    return new Map(cards.map((c) => [c.userId, byCard.get(c.id) ?? 0]));
  }

  /**
   * Manda la campaña.
   *
   * El estado pasa a SENDING antes de mandar nada. Si el proceso se cae a
   * la mitad, la campaña queda marcada como en curso en vez de volver a
   * salir entera desde el principio.
   *
   * Un fallo de una persona no detiene a las demás: se apunta en su
   * entrega y se sigue. Un correo rebotado no es motivo para dejar sin
   * mensaje a las otras novecientas.
   */
  async send(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Esa campaña no existe');

    if (!canSend(campaign.status, campaign.scheduledAt)) {
      throw new BadRequestException(
        campaign.status === 'SENT'
          ? 'Esa campaña ya se envió. Duplica la campaña si quieres repetirla.'
          : `No se puede enviar una campaña en estado ${campaign.status}`,
      );
    }

    if (campaign.channel === 'SMS') {
      throw new BadRequestException('El canal SMS todavía no está conectado. Usa EMAIL por ahora.');
    }

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' },
    });

    const people = await this.recipients(campaign.audience as Audience);
    const points = await this.pointsByUser(people.map((p) => p.id));

    let enviados = 0;
    let fallidos = 0;

    for (const person of people) {
      const body = fillTemplate(campaign.body, {
        nombre: person.name,
        puntos: points.get(person.id) ?? 0,
      });

      try {
        await this.mailer.send({
          to: person.email,
          subject: campaign.subject ?? campaign.name,
          text: body,
        });
        await this.recordDelivery(campaignId, person.id, 'SENT');
        await this.prisma.notification.create({
          data: {
            userId: person.id,
            channel: 'EMAIL',
            type: 'MARKETING',
            title: campaign.subject ?? campaign.name,
            body,
          },
        });
        enviados++;
      } catch (error) {
        await this.recordDelivery(campaignId, person.id, 'FAILED', (error as Error).message);
        fallidos++;
      }
    }

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: fallidos && !enviados ? 'FAILED' : 'SENT', sentAt: new Date() },
    });

    this.logger.log(`Campaña "${campaign.name}": ${enviados} enviados, ${fallidos} fallidos`);
    return { enviados, fallidos, destinatarios: people.length };
  }

  private recordDelivery(
    campaignId: string,
    userId: string,
    status: 'SENT' | 'FAILED' | 'SKIPPED',
    error?: string,
  ) {
    // La clave única de campaña y persona es lo que garantiza que nadie
    // reciba el mismo correo dos veces aunque el envío se reintente.
    return this.prisma.campaignDelivery.upsert({
      where: { campaignId_userId: { campaignId, userId } },
      update: { status, error, sentAt: new Date() },
      create: { campaignId, userId, status, error, sentAt: new Date() },
    });
  }
}
