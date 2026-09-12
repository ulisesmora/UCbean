import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateOrderStatusUseCase } from '../update-order-status.use-case';
import { IOrderRepository } from '../../../domain/repositories/order.repository.interface';
import { OrderEntity, OrderItemEntity } from '../../../domain/entities/order.entity';

const makeOrder = (status: OrderEntity['status']) =>
  new OrderEntity(
    'ord-1',
    'user-1',
    'PICKUP',
    status,
    10.0,
    [new OrderItemEntity('oi-1', 'p-1', 2, 5.0)],
    null,
    null,
    new Date(),
    new Date(),
  );

describe('UpdateOrderStatusUseCase', () => {
  let useCase: UpdateOrderStatusUseCase;
  let repo: jest.Mocked<IOrderRepository>;
  let events: { emit: jest.Mock };

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      findByUser: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
    };
    events = { emit: jest.fn() };
    useCase = new UpdateOrderStatusUseCase(repo, events as any);
  });

  it('transitions PENDING → CONFIRMED', async () => {
    const order = makeOrder('PENDING');
    const confirmed = makeOrder('CONFIRMED');
    repo.findById.mockResolvedValue(order);
    repo.updateStatus.mockResolvedValue(confirmed);

    const result = await useCase.execute('ord-1', 'CONFIRMED');
    expect(result.status).toBe('CONFIRMED');
    expect(repo.updateStatus).toHaveBeenCalledWith('ord-1', 'CONFIRMED', undefined);
  });

  it('throws NotFoundException when order not found', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('bad-id', 'CONFIRMED')).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException for invalid transition (COMPLETED → PENDING)', async () => {
    repo.findById.mockResolvedValue(makeOrder('COMPLETED'));
    await expect(useCase.execute('ord-1', 'PENDING' as any)).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for invalid transition (PENDING → COMPLETED)', async () => {
    repo.findById.mockResolvedValue(makeOrder('PENDING'));
    await expect(useCase.execute('ord-1', 'COMPLETED')).rejects.toThrow(BadRequestException);
  });
});
