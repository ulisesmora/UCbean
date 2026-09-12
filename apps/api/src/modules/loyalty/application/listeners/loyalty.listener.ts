import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EVENTS,
  type OrderStatusChangedEvent,
  type UserRegisteredEvent,
} from '../../../../common/events/domain-events';
import { SendNotificationUseCase } from '../../../notifications/application/use-cases/send-notification.use-case';
import * as t from '../../../notifications/domain/templates';
import { SIGNUP_POINTS } from '../../domain/points-policy';
import { LoyaltyService } from '../use-cases/loyalty.service';

/**
 * Cuándo se ganan puntos.
 *
 * Al completar el pedido, no al hacerlo. Un pedido cancelado no debería
 * dejar puntos, y regalarlos al crearlo obligaría a quitarlos después,
 * que es la clase de movimiento que un cliente lee como un cobro.
 */
@Injectable()
export class LoyaltyListener {
  constructor(
    private readonly loyalty: LoyaltyService,
    private readonly notify: SendNotificationUseCase,
  ) {}

  @OnEvent(EVENTS.userRegistered)
  async onRegistered(e: UserRegisteredEvent) {
    await this.loyalty.addPoints(e.userId, SIGNUP_POINTS, 'SIGNUP', {
      note: 'Bienvenida',
    });
  }

  @OnEvent(EVENTS.orderStatusChanged)
  async onStatusChanged(e: OrderStatusChangedEvent) {
    if (e.status !== 'COMPLETED') return;

    const balance = await this.loyalty.rewardOrder(e.userId, e.orderId, e.total);
    const earned = balance > 0 ? Math.floor(e.total) : 0;
    if (earned === 0) return;

    // Solo en la cuenta. Un correo por cada café sería el camino más
    // corto a que la gente marque la cafetería como spam.
    await this.notify.execute({
      userId: e.userId,
      type: 'LOYALTY',
      message: t.pointsEarned(earned, balance),
      channels: { email: false, inApp: true },
    });
  }
}
