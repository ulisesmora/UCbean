import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/repositories/order.repository.interface';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../products/domain/repositories/product.repository.interface';
import { OrderEntity, OrderType } from '../../domain/entities/order.entity';
import type { DrinkBuild } from '../../domain/value-objects/drink-build';
import { priceOfBuild, priceOfExtras } from '../../domain/value-objects/drink-price';
import { priceOfRecipeLine } from '../../domain/value-objects/price-book';
import { ReservePickupSlotUseCase } from '../../../reservations/application/use-cases/reserve-pickup-slot.use-case';
import { PickupReservation } from '../../../reservations/domain/entities/pickup-reservation.entity';
import { EVENTS, type OrderPlacedEvent } from '../../../../common/events/domain-events';
import { AddressesService } from '../../../addresses/application/use-cases/addresses.service';
import { DiscountsService } from '../../../discounts/application/use-cases/discounts.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { esDuplicado, serializable } from '../../../../prisma/transaction';

export interface CreateOrderInput {
  userId: string;
  type: OrderType;
  notes?: string;
  deliveryAddressId?: string;
  /** Required for PICKUP. When the customer is coming to collect it. */
  slotTime?: Date;
  /** Codigo de descuento, si el cliente puso uno. */
  discountCode?: string;
  /**
   * La llave de este intento de pedir, generada en el navegador.
   * La misma llave dos veces devuelve el mismo pedido, no dos.
   */
  idempotencyKey?: string;
  /** Lo antes posible: el servidor elige el primer hueco con sitio. */
  asap?: boolean;
  items: {
    productId: string;
    qty: number;
    build?: DrinkBuild;
    /** Extras sobre un producto de carta. Se cobran encima de su precio. */
    extras?: string[];
    /** For here or to go, on a menu item. */
    vessel?: 'here' | 'togo';
    recipeId?: string;
    name?: string;
    ticket?: string;
  }[];
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: IOrderRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository,
    private readonly pickup: ReservePickupSlotUseCase,
    private readonly events: EventEmitter2,
    private readonly addresses: AddressesService,
    private readonly discounts: DiscountsService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    input: CreateOrderInput,
  ): Promise<{ order: OrderEntity; pickup: PickupReservation | null; replayed: boolean }> {
    if (!input.items.length) {
      throw new BadRequestException('Order must have at least one item');
    }

    // Un doble clic, un reintento de red o dos pestañas mandan la misma
    // llave. Si ese pedido ya existe se devuelve tal cual: sin cobrar dos
    // veces el cupón, sin reservar dos plazas y sin mandar dos correos.
    if (input.idempotencyKey) {
      const previo = await this.porLlave(input.userId, input.idempotencyKey);
      if (previo) return previo;
    }

    let slotTime = input.slotTime;

    if (input.type === 'PICKUP') {
      if (input.asap && !slotTime) {
        const siguiente = await this.pickup.nextOpenSlot();
        if (!siguiente) {
          throw new BadRequestException('No pickup slots left today. Pick a time tomorrow.');
        }
        slotTime = siguiente;
      }
      if (!slotTime) throw new BadRequestException('Pick a collection time');
    }

    if (input.type === 'DELIVERY') {
      if (!input.deliveryAddressId) {
        throw new BadRequestException('A delivery order needs an address');
      }
      await this.addresses.assertOwned(input.deliveryAddressId, input.userId);
    }

    const resolvedItems = await Promise.all(
      input.items.map(async (item) => {
        const product = await this.products.findById(item.productId);
        if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
        if (!product.isAvailable) {
          throw new BadRequestException(`Product "${product.name}" is not available`);
        }
        // Price is ours, never the client's. A built drink is priced by its
        // formula; a catalogue item by the shelf plus whatever was added on top.
        // A recipe with a fixed menu price charges that price, plus whatever
        // the customer changed on it.
        const recipe =
          item.build && item.recipeId
            ? await this.prisma.recipe.findUnique({
                where: { slug: item.recipeId },
                select: { build: true, priceOverride: true },
              })
            : null;
        return {
          ...item,
          unitPrice: item.build
            ? priceOfRecipeLine(
                item.build,
                recipe
                  ? {
                      build: recipe.build as unknown as DrinkBuild,
                      priceOverride: recipe.priceOverride?.toNumber() ?? null,
                    }
                  : null,
              )
            : Math.round((product.price + priceOfExtras(item.extras)) * 100) / 100,
          name: item.name ?? product.name,
        };
      }),
    );

    const bruto = resolvedItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);

    let resultado: { order: OrderEntity; pickup: PickupReservation | null };
    try {
      // Todo lo que tiene que pasar junto, pasa junto. Antes eran cuatro
      // escrituras sueltas: si la reserva fallaba después de crear el pedido,
      // quedaba un pedido sin hora; si el cupón fallaba, un pedido cobrado a
      // precio completo. Ahora o se escribe todo o no se escribe nada.
      //
      // Serializable porque aquí hay dos reglas de «cuenta y luego escribe»:
      // plazas libres en el hueco y usos que le quedan al cupón.
      resultado = await serializable(this.prisma, async (tx) => {
        if (input.type === 'PICKUP' && slotTime) {
          await this.pickup.assertOpen(slotTime, tx);
        }

        const applied = input.discountCode
          ? await this.discounts.preview(input.discountCode, input.userId, bruto, tx)
          : null;

        const order = await this.orders.create(
          {
            userId: input.userId,
            type: input.type,
            notes: input.notes,
            deliveryAddressId: input.deliveryAddressId,
            discountAmount: applied?.amount,
            idempotencyKey: input.idempotencyKey,
            items: resolvedItems,
          },
          tx,
        );

        if (applied && input.discountCode) {
          await this.discounts.consume(input.discountCode, input.userId, bruto, order.id, tx);
        }

        const pickup =
          input.type === 'PICKUP' && slotTime
            ? await this.pickup.execute(order.id, slotTime, tx)
            : null;

        return { order, pickup };
      });
    } catch (e) {
      // Dos peticiones con la misma llave a la vez: las dos pasan la
      // comprobación de arriba, pero el índice único solo deja entrar a una.
      // La otra recibe el pedido que ganó.
      if (input.idempotencyKey && esDuplicado(e)) {
        const ganador = await this.porLlave(input.userId, input.idempotencyKey);
        if (ganador) return ganador;
      }
      throw e;
    }

    // Los avisos, después de que la transacción se confirmó. Anunciar dentro
    // y que luego se deshiciera sería mandar un correo de un pedido que no existe.
    this.events.emit(EVENTS.orderPlaced, {
      orderId: resultado.order.id,
      userId: resultado.order.userId,
      total: resultado.order.total,
      lines: resultado.order.items.map(
        (i) => `${i.qty} x ${i.name ?? 'Drink'}${i.ticket ? ` (${i.ticket})` : ''}`,
      ),
      slotTime: resultado.pickup?.slotTime,
      confirmationCode: resultado.pickup?.confirmationCode,
    } satisfies OrderPlacedEvent);

    return { ...resultado, replayed: false };
  }

  /** El pedido que ya se hizo con esta llave, si lo hay. */
  private async porLlave(userId: string, idempotencyKey: string) {
    const fila = await this.prisma.order.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      select: { id: true },
    });
    if (!fila) return null;

    const order = await this.orders.findById(fila.id);
    if (!order) return null;

    const r = await this.pickup.forOrder(fila.id);
    const pickup = r
      ? new PickupReservation(r.id, r.orderId, r.slotTime, r.confirmationCode, r.createdAt)
      : null;
    return { order, pickup, replayed: true };
  }
}
