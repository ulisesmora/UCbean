import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS, type UserRegisteredEvent } from '../../../../common/events/domain-events';
import { SendNotificationUseCase } from '../../../notifications/application/use-cases/send-notification.use-case';
import * as t from '../../../notifications/domain/templates';
import { DiscountsService } from '../use-cases/discounts.service';

/** Lo que se regala al abrir la cuenta: un 10% para el primer pedido. */
export const WELCOME_DISCOUNT = {
  kind: 'PERCENT' as const,
  value: 10,
  description: 'Welcome: 10% off your first order',
  days: 30,
};

@Injectable()
export class DiscountsListener {
  constructor(
    private readonly discounts: DiscountsService,
    private readonly notify: SendNotificationUseCase,
  ) {}

  @OnEvent(EVENTS.userRegistered)
  async onRegistered(e: UserRegisteredEvent) {
    const discount = await this.discounts.grantPersonal(e.userId, 'SIGNUP', WELCOME_DISCOUNT);
    await this.notify.execute({
      userId: e.userId,
      type: 'ACCOUNT',
      message: t.welcome(e.name, discount.code),
    });
  }
}
