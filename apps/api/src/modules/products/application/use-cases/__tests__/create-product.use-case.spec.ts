import { NotFoundException } from '@nestjs/common';
import { CreateProductUseCase } from '../create-product.use-case';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { Product } from '../../../domain/entities/product.entity';
import { Category } from '../../../domain/entities/category.entity';

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let productRepo: jest.Mocked<IProductRepository>;
  let categoryRepo: jest.Mocked<ICategoryRepository>;

  const category = new Category('cat-1', 'Hot Coffee');
  const product = new Product(
    'p-1',
    'cat-1',
    'Latte',
    5.5,
    true,
    null,
    null,
    new Date(),
    new Date(),
  );

  beforeEach(() => {
    productRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    categoryRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
    };
    useCase = new CreateProductUseCase(productRepo, categoryRepo);
  });

  it('creates a product when category exists', async () => {
    categoryRepo.findById.mockResolvedValue(category);
    productRepo.create.mockResolvedValue(product);

    const result = await useCase.execute({ categoryId: 'cat-1', name: 'Latte', price: 5.5 });

    expect(result).toBe(product);
    expect(productRepo.create).toHaveBeenCalledWith({
      categoryId: 'cat-1',
      name: 'Latte',
      price: 5.5,
    });
  });

  it('throws NotFoundException when category does not exist', async () => {
    categoryRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ categoryId: 'nonexistent', name: 'Latte', price: 5.5 }),
    ).rejects.toThrow(NotFoundException);
    expect(productRepo.create).not.toHaveBeenCalled();
  });
});
