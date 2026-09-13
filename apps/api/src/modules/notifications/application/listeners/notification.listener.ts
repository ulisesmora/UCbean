import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EVENTS,
  type OrderPlacedEvent,
  type OrderStatusChangedEvent,
  type PaymentFailedEvent,
  type PaymentRefundedEvent,
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
    if (e.status === 'PREPARING') {
      // Solo push: es el aviso de «sal ya», y llega mientras la persona
      // camina. Un correo por cada café sería spam propio.
      await this.notify.execute({
        userId: e.userId,
        type: 'ORDER',
        orderId: e.orderId,
        message: t.orderPreparing(),
        url: `/order/${e.orderId}`,
        channels: { email: false, inApp: true, push: true },
      });
      return;
    }

    if (e.status === 'READY') {
      // El único con las tres vías. Un café en la barra se enfría, y este
      // es el momento en que avisar de más cuesta menos que avisar de menos.
      await this.notify.execute({
        userId: e.userId,
        type: 'ORDER',
        orderId: e.orderId,
        message: t.orderReady(),
        url: `/order/${e.orderId}`,
        channels: { push: true },
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

  @OnEvent(EVENTS.paymentFailed)
  async onPaymentFailed(e: PaymentFailedEvent) {
    // Solo en la cuenta. Quien paga está en la pantalla y ya ve el error; un
    // correo o un push por cada tarjeta rechazada sería ruido. El aviso queda
    // para quien cerró la pestaña sin enterarse.
    await this.notify.execute({
      userId: e.userId,
      type: 'ORDER',
      orderId: e.orderId,
      message: t.paymentFailed(e.reason),
      url: `/order/${e.orderId}`,
      channels: { email: false, inApp: true },
    });
  }

  @OnEvent(EVENTS.paymentRefunded)
  async onPaymentRefunded(e: PaymentRefundedEvent) {
    // Un reembolso sí va por correo: es dinero que vuelve y la persona
    // querrá tenerlo por escrito.
    await this.notify.execute({
      userId: e.userId,
      type: 'ORDER',
      orderId: e.orderId,
      message: t.paymentRefunded(e.amount, e.full),
      url: `/order/${e.orderId}`,
    });
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
