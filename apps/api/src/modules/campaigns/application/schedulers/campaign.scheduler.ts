import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../prisma/prisma.service';
import { DiscountsService } from '../../../discounts/application/use-cases/discounts.service';
import { LoyaltyService } from '../../../loyalty/application/use-cases/loyalty.service';
import { SendNotificationUseCase } from '../../../notifications/application/use-cases/send-notification.use-case';
import * as t from '../../../notifications/domain/templates';
import { BIRTHDAY_POINTS } from '../../../loyalty/domain/points-policy';
import { CampaignsService } from '../use-cases/campaigns.service';

/** El regalo de cumpleaños: un café gratis hasta fin de mes. */
export const BIRTHDAY_DISCOUNT = {
  kind: 'AMOUNT' as const,
  value: 6,
  description: 'Birthday: a coffee on us',
  days: 30,
};

/**
 * Lo que pasa solo, sin que nadie apriete nada.
 *
 * `@nestjs/schedule` ya estaba instalado y sin usar. Dos tareas:
 * soltar las campañas cuya hora llegó, y felicitar a quien cumple hoy.
 *
 * Las dos corren cada hora en punto, no cada minuto. Una campaña que
 * sale a las 9 en vez de a las 9:00:30 no le importa a nadie, y cada
 * ejecución son varias consultas.
 */
@Injectable()
export class CampaignScheduler {
  private readonly logger = new Logger(CampaignScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly campaigns: CampaignsService,
    private readonly discounts: DiscountsService,
    private readonly loyalty: LoyaltyService,
    private readonly notify: SendNotificationUseCase,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendScheduled() {
    const pending = await this.prisma.campaign.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
      select: { id: true, name: true },
    });

    for (const c of pending) {
      try {
        await this.campaigns.send(c.id);
      } catch (error) {
        this.logger.error(`La campaña "${c.name}" falló: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Felicita a quien cumple hoy.
   *
   * Corre cada hora y no una vez al día para que un reinicio a media
   * mañana no deje a nadie sin su felicitación. Lo que evita el mensaje
   * repetido no es el horario, es que el descuento de cumpleaños solo se
   * concede una vez por temporada.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async birthdays() {
    const hoy = new Date();
    const people = await this.prisma.user.findMany({
      where: { birthday: { not: null }, role: 'CUSTOMER' },
      select: { id: true, name: true, birthday: true },
    });

    const cumplen = people.filter(
      (p) => p.birthday!.getDate() === hoy.getDate() && p.birthday!.getMonth() === hoy.getMonth(),
    );

    for (const person of cumplen) {
      const discount = await this.discounts.grantPersonal(person.id, 'BIRTHDAY', BIRTHDAY_DISCOUNT);

      // `grantPersonal` devuelve el que ya existía si hoy ya se felicitó,
      // así que este es el corte que evita el segundo mensaje.
      const yaFelicitado = discount.createdAt.getTime() < hoy.getTime() - 60 * 60_000;
      if (yaFelicitado) continue;

      await this.loyalty.addPoints(person.id, BIRTHDAY_POINTS, 'BIRTHDAY', {
        note: 'Birthday',
      });
      await this.notify.execute({
        userId: person.id,
        type: 'LOYALTY',
        message: t.birthday(person.name, discount.code),
      });
    }

    if (cumplen.length) this.logger.log(`${cumplen.length} cumpleaños hoy`);
  }
}
