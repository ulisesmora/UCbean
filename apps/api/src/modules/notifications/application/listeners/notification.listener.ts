import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EVENTS,
  type OrderPlacedEvent,
  type OrderStatusChangedEvent,
  type TableReservationPlacedEvent,
} from '../../../../common/events/domain-events';
import * as t from '../../domain/templates';
import { SendNotificationUseCase } from '../use-cases/send-notification.use-case';

/**
 * Qué se avisa y cuándo.
 *
 * Solo tres momentos del pedido llegan al cliente: confirmado, listo y
 * cancelado. PREPARING no se avisa a propósito: nadie quiere tres
 * correos por un café, y un aviso que no aporta nada enseña a la gente
 * a ignorar los que sí importan.
 */
@Injectable()
export class NotificationListener {
  constructor(private readonly notify: SendNotificationUseCase) {}

  @OnEvent(EVENTS.orderPlaced)
  async onOrderPlaced(e: OrderPlacedEvent) {
    await this.notify.execute({
      userId: e.userId,
      type: 'ORDER',
      orderId: e.orderId,
      message: t.orderPlaced(e.lines, e.total, e.slotTime, e.confirmationCode),
    });
  }

  @OnEvent(EVENTS.orderStatusChanged)
  async onStatusChanged(e: OrderStatusChangedEvent) {
    if (e.status === 'READY') {
      await this.notify.execute({
        userId: e.userId,
        type: 'ORDER',
        orderId: e.orderId,
        message: t.orderReady(),
      });
      return;
    }
    if (e.status === 'CANCELLED') {
      await this.notify.execute({
        userId: e.userId,
        type: 'ORDER',
        orderId: e.orderId,
        message: t.orderCancelled(),
      });
    }
  }

  @OnEvent(EVENTS.tableReservationPlaced)
  async onTableBooked(e: TableReservationPlacedEvent) {
    await this.notify.execute({
      userId: e.userId,
      type: 'RESERVATION',
      message: t.tableBooked(e.partySize, e.scheduledAt),
    });
  }
}
