import { ListProductsUseCase } from '../list-products.use-case';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { Product } from '../../../domain/entities/product.entity';

const makeProduct = (id: string) =>
  new Product(id, 'cat-1', `Product ${id}`, 5.0, true, null, null, new Date(), new Date());

describe('ListProductsUseCase', () => {
  let useCase: ListProductsUseCase;
  let repo: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new ListProductsUseCase(repo);
  });

  it('returns all products when no categoryId given', async () => {
    repo.findAll.mockResolvedValue([makeProduct('p1'), makeProduct('p2')]);
    const result = await useCase.execute();
    expect(result).toHaveLength(2);
    expect(repo.findAll).toHaveBeenCalledWith(undefined);
  });

  it('filters by categoryId', async () => {
    repo.findAll.mockResolvedValue([makeProduct('p1')]);
    await useCase.execute('cat-1');
    expect(repo.findAll).toHaveBeenCalledWith('cat-1');
  });

  it('returns empty array when no products', async () => {
    repo.findAll.mockResolvedValue([]);
    const result = await useCase.execute();
    expect(result).toEqual([]);
  });
});
