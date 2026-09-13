import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrderUseCase } from '../create-order.use-case';
import { IOrderRepository } from '../../../domain/repositories/order.repository.interface';
import { IProductRepository } from '../../../../products/domain/repositories/product.repository.interface';
import { Product } from '../../../../products/domain/entities/product.entity';
import { OrderEntity, OrderItemEntity } from '../../../domain/entities/order.entity';
import { ReservePickupSlotUseCase } from '../../../../reservations/application/use-cases/reserve-pickup-slot.use-case';
import { PickupReservation } from '../../../../reservations/domain/entities/pickup-reservation.entity';

/** Far enough ahead to stay in the future, and on a real 15 minute boundary. */

/** Un emisor falso: solo interesa qué se anunció y con qué datos. */
const fakeEmitter = () => ({ emit: jest.fn() }) as any;

const SLOT = new Date(Date.now() + 3 * 3_600_000);
SLOT.setMinutes(30, 0, 0);

const makeProduct = (id: string, available = true) =>
  new Product(id, 'cat-1', `P ${id}`, 5.0, available, null, null, new Date(), new Date());

const makeOrder = () =>
  new OrderEntity(
    'ord-1',
    'user-1',
    'PICKUP',
    'PENDING',
    10.0,
    [new OrderItemEntity('oi-1', 'p-1', 2, 5.0)],
    null,
    null,
    new Date(),
    new Date(),
  );

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let orderRepo: jest.Mocked<IOrderRepository>;
  let productRepo: jest.Mocked<IProductRepository>;
  let pickup: jest.Mocked<Pick<ReservePickupSlotUseCase, 'assertOpen' | 'execute'>>;
  let events: { emit: jest.Mock };
  let addresses: { assertOwned: jest.Mock };
  let discounts: { preview: jest.Mock; consume: jest.Mock };

  beforeEach(() => {
    orderRepo = {
      findById: jest.fn(),
      findByUser: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      transition: jest.fn(),
    };
    productRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    pickup = {
      assertOpen: jest.fn().mockResolvedValue(undefined),
      execute: jest
        .fn()
        .mockResolvedValue(new PickupReservation('pr-1', 'ord-1', SLOT, 'ABC234', new Date())),
    };
    events = fakeEmitter();
    addresses = { assertOwned: jest.fn().mockResolvedValue(undefined) };
    discounts = {
      preview: jest.fn().mockResolvedValue({ discountId: 'd1', code: 'HOLA1', amount: 1.5 }),
      consume: jest.fn().mockResolvedValue({}),
    };
    // La transacción corre la función con el mismo cliente falso: lo que se
    // prueba aquí son las reglas del pedido, no Postgres.
    const prisma = {
      $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn({})),
      order: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    useCase = new CreateOrderUseCase(
      orderRepo,
      productRepo,
      pickup as any,
      events as any,
      addresses as any,
      discounts as any,
      prisma,
    );
  });

  it('creates order with valid products', async () => {
    productRepo.findById.mockResolvedValue(makeProduct('p-1'));
    orderRepo.create.mockResolvedValue(makeOrder());

    const { order } = await useCase.execute({
      userId: 'user-1',
      type: 'PICKUP',
      slotTime: SLOT,
      items: [{ productId: 'p-1', qty: 2 }],
    });

    expect(order.id).toBe('ord-1');
    expect(order.userId).toBe('user-1');
    expect(order.status).toBe('PENDING');
    expect(orderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', type: 'PICKUP' }),
      expect.anything(),
    );
  });

  it('throws BadRequestException when items array is empty', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', type: 'PICKUP', slotTime: SLOT, items: [] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('books the pickup slot and reports the confirmation code', async () => {
    productRepo.findById.mockResolvedValue(makeProduct('p-1'));
    orderRepo.create.mockResolvedValue(makeOrder());

    const result = await useCase.execute({
      userId: 'user-1',
      type: 'PICKUP',
      slotTime: SLOT,
      items: [{ productId: 'p-1', qty: 1 }],
    });

    expect(pickup.execute).toHaveBeenCalledWith('ord-1', SLOT, expect.anything());
    expect(result.pickup?.confirmationCode).toBe('ABC234');
  });

  it('anuncia el pedido con la hora y el codigo, para que salga el aviso', async () => {
    productRepo.findById.mockResolvedValue(makeProduct('p-1'));
    orderRepo.create.mockResolvedValue(makeOrder());

    await useCase.execute({
      userId: 'user-1',
      type: 'PICKUP',
      slotTime: SLOT,
      items: [{ productId: 'p-1', qty: 1 }],
    });

    expect(events.emit).toHaveBeenCalledWith(
      'order.placed',
      expect.objectContaining({
        orderId: 'ord-1',
        userId: 'user-1',
        confirmationCode: 'ABC234',
        slotTime: SLOT,
      }),
    );
  });

  it('no anuncia nada cuando el pedido se rechaza', async () => {
    await expect(useCase.execute({ userId: 'user-1', type: 'PICKUP', items: [] })).rejects.toThrow(
      BadRequestException,
    );
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('refuses a pickup order with no collection time, before writing anything', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', type: 'PICKUP', items: [{ productId: 'p-1', qty: 1 }] }),
    ).rejects.toThrow(BadRequestException);
    expect(orderRepo.create).not.toHaveBeenCalled();
  });

  it('leaves no order behind when the slot is full', async () => {
    productRepo.findById.mockResolvedValue(makeProduct('p-1'));
    pickup.assertOpen.mockRejectedValue(new BadRequestException('full'));

    await expect(
      useCase.execute({
        userId: 'user-1',
        type: 'PICKUP',
        slotTime: SLOT,
        items: [{ productId: 'p-1', qty: 1 }],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(orderRepo.create).not.toHaveBeenCalled();
  });

  it('stores the drink formula and the catalogue price, not the client price', async () => {
    productRepo.findById.mockResolvedValue(makeProduct('p-1'));
    orderRepo.create.mockResolvedValue(makeOrder());

    const build = {
      beans: 'ethiopia',
      size: 'medium' as const,
      base: 'latte',
      serve: 'hot' as const,
      milk: 'oat',
      foam: 'micro' as const,
      art: 'heart' as const,
      extras: ['cinnamon'],
      vessel: 'here' as const,
      sleeve: 'kraft',
    };

    await useCase.execute({
      userId: 'user-1',
      type: 'TABLE',
      items: [{ productId: 'p-1', qty: 1, build, recipeId: 'latte', ticket: 'Medium · hot · oat' }],
    });

    expect(orderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({ build, recipeId: 'latte', unitPrice: 6.2, name: 'P p-1' }),
        ],
      }),
      expect.anything(),
    );
  });

  it('exige direccion en un pedido a domicilio', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        type: 'DELIVERY',
        items: [{ productId: 'p-1', qty: 1 }],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(orderRepo.create).not.toHaveBeenCalled();
  });

  it('comprueba que la direccion es de quien pide, antes de escribir nada', async () => {
    // Sin esto, mandar el id de la direccion de otra persona la devolveria
    // en el pedido.
    addresses.assertOwned.mockRejectedValue(new BadRequestException('no es tuya'));

    await expect(
      useCase.execute({
        userId: 'user-1',
        type: 'DELIVERY',
        deliveryAddressId: 'de-otro',
        items: [{ productId: 'p-1', qty: 1 }],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(orderRepo.create).not.toHaveBeenCalled();
  });

  it('aplica el cupon al total y lo gasta despues de escribir el pedido', async () => {
    productRepo.findById.mockResolvedValue(makeProduct('p-1'));
    orderRepo.create.mockResolvedValue(makeOrder());

    await useCase.execute({
      userId: 'user-1',
      type: 'TABLE',
      discountCode: 'HOLA1',
      items: [{ productId: 'p-1', qty: 2 }],
    });

    // Se comprueba sobre el bruto, 2 x 5.00, no sobre cero.
    expect(discounts.preview).toHaveBeenCalledWith('HOLA1', 'user-1', 10, expect.anything());
    expect(orderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ discountAmount: 1.5 }),
      expect.anything(),
    );
    // Se gasta con el id del pedido, que solo existe despues de crearlo.
    expect(discounts.consume).toHaveBeenCalledWith(
      'HOLA1',
      'user-1',
      10,
      'ord-1',
      expect.anything(),
    );
  });

  it('no escribe el pedido si el cupon no vale', async () => {
    // Un cupon caducado tiene que tumbar la peticion entera, no dejar un
    // pedido a precio completo que el cliente creia con descuento.
    productRepo.findById.mockResolvedValue(makeProduct('p-1'));
    discounts.preview.mockRejectedValue(new BadRequestException('Ese codigo ya vencio'));

    await expect(
      useCase.execute({
        userId: 'user-1',
        type: 'TABLE',
        discountCode: 'VIEJO',
        items: [{ productId: 'p-1', qty: 1 }],
      }),
    ).rejects.toThrow(BadRequestException);

    expect(orderRepo.create).not.toHaveBeenCalled();
    expect(discounts.consume).not.toHaveBeenCalled();
  });

  it('no toca descuentos cuando no hay codigo', async () => {
    productRepo.findById.mockResolvedValue(makeProduct('p-1'));
    orderRepo.create.mockResolvedValue(makeOrder());

    await useCase.execute({
      userId: 'user-1',
      type: 'TABLE',
      items: [{ productId: 'p-1', qty: 1 }],
    });

    expect(discounts.preview).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when product does not exist', async () => {
    productRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'user-1',
        type: 'PICKUP',
        slotTime: SLOT,
        items: [{ productId: 'bad', qty: 1 }],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when product is unavailable', async () => {
    productRepo.findById.mockResolvedValue(makeProduct('p-1', false));

    await expect(
      useCase.execute({
        userId: 'user-1',
        type: 'PICKUP',
        slotTime: SLOT,
        items: [{ productId: 'p-1', qty: 1 }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  describe('idempotencia', () => {
    it('la misma llave dos veces devuelve el mismo pedido y no crea otro', async () => {
      // El doble toque en «Place order». La segunda petición no puede crear
      // un segundo pedido, reservar otra plaza ni mandar otro correo.
      productRepo.findById.mockResolvedValue(makeProduct('p-1'));
      orderRepo.findById.mockResolvedValue(makeOrder());
      (useCase as any).prisma.order.findUnique.mockResolvedValue({ id: 'ord-1' });
      (pickup as any).forOrder = jest.fn().mockResolvedValue(null);

      const r = await useCase.execute({
        userId: 'user-1',
        type: 'TABLE',
        idempotencyKey: 'llave-de-prueba-1',
        items: [{ productId: 'p-1', qty: 2 }],
      });

      expect(r.replayed).toBe(true);
      expect(r.order.id).toBe('ord-1');
      expect(orderRepo.create).not.toHaveBeenCalled();
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('si dos llegan a la vez, la que pierde el índice único recibe el pedido ganador', async () => {
      const { Prisma } = require('@prisma/client');
      productRepo.findById.mockResolvedValue(makeProduct('p-1'));
      orderRepo.findById.mockResolvedValue(makeOrder());
      (pickup as any).forOrder = jest.fn().mockResolvedValue(null);

      const prisma = (useCase as any).prisma;
      // Primera consulta: todavía no existe. Tras el choque: ya existe.
      prisma.order.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'ord-1' });
      prisma.$transaction.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      const r = await useCase.execute({
        userId: 'user-1',
        type: 'TABLE',
        idempotencyKey: 'llave-de-prueba-2',
        items: [{ productId: 'p-1', qty: 2 }],
      });

      expect(r.replayed).toBe(true);
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('un choque de serialización se reintenta y termina creando el pedido', async () => {
      const { Prisma } = require('@prisma/client');
      productRepo.findById.mockResolvedValue(makeProduct('p-1'));
      orderRepo.create.mockResolvedValue(makeOrder());

      const prisma = (useCase as any).prisma;
      const original = prisma.$transaction.getMockImplementation();
      // Primer intento: Postgres aborta por conflicto con otra transacción.
      prisma.$transaction
        .mockRejectedValueOnce(
          new Prisma.PrismaClientKnownRequestError('could not serialize access', {
            code: 'P2034',
            clientVersion: 'test',
          }),
        )
        .mockImplementation(original);

      const r = await useCase.execute({
        userId: 'user-1',
        type: 'TABLE',
        items: [{ productId: 'p-1', qty: 2 }],
      });

      expect(r.replayed).toBe(false);
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      expect(events.emit).toHaveBeenCalledTimes(1);
    });
  });
});
