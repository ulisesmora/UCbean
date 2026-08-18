import { NotFoundException } from '@nestjs/common';
import { UpdateProductUseCase } from '../update-product.use-case';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { Product } from '../../../domain/entities/product.entity';

const makeProduct = (id: string) =>
  new Product(id, 'cat-1', 'Espresso', 3.5, true, null, null, new Date(), new Date());

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let repo: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new UpdateProductUseCase(repo);
  });

  it('updates and returns product', async () => {
    const existing = makeProduct('p-1');
    const updated = makeProduct('p-1');
    repo.findById.mockResolvedValue(existing);
    repo.update.mockResolvedValue(updated);

    const result = await useCase.execute('p-1', { price: 4.0 });

    expect(result).toBe(updated);
    expect(repo.update).toHaveBeenCalledWith('p-1', { price: 4.0 });
  });

  it('throws NotFoundException when product does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('not-found', { price: 4.0 })).rejects.toThrow(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
