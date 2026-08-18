import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrderUseCase } from '../create-order.use-case';
import { IOrderRepository } from '../../../domain/repositories/order.repository.interface';
import { IProductRepository } from '../../../../products/domain/repositories/product.repository.interface';
import { Product } from '../../../../products/domain/entities/product.entity';
import { OrderEntity, OrderItemEntity } from '../../../domain/entities/order.entity';

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
    useCase = new CreateOrderUseCase(orderRepo, productRepo);
  });

  it('creates order with valid products', async () => {
    productRepo.findById.mockResolvedValue(makeProduct('p-1'));
    orderRepo.create.mockResolvedValue(makeOrder());

    const result = await useCase.execute({
      userId: 'user-1',
      type: 'PICKUP',
      items: [{ productId: 'p-1', qty: 2 }],
    });

    expect(result.id).toBe('ord-1');
    expect(result.userId).toBe('user-1');
    expect(result.status).toBe('PENDING');
    expect(orderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', type: 'PICKUP' }),
    );
  });

  it('throws BadRequestException when items array is empty', async () => {
    await expect(useCase.execute({ userId: 'user-1', type: 'PICKUP', items: [] })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws NotFoundException when product does not exist', async () => {
    productRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-1', type: 'PICKUP', items: [{ productId: 'bad', qty: 1 }] }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when product is unavailable', async () => {
    productRepo.findById.mockResolvedValue(makeProduct('p-1', false));

    await expect(
      useCase.execute({ userId: 'user-1', type: 'PICKUP', items: [{ productId: 'p-1', qty: 1 }] }),
    ).rejects.toThrow(BadRequestException);
  });
});
