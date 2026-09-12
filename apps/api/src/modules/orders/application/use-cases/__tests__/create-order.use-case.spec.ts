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

  beforeEach(() => {
    orderRepo = {
      findById: jest.fn(),
      findByUser: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
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
    useCase = new CreateOrderUseCase(orderRepo, productRepo, pickup as any, events as any);
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

    expect(pickup.execute).toHaveBeenCalledWith('ord-1', SLOT);
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
    );
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
});
