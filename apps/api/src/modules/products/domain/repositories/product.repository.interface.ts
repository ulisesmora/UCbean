import { Product } from '../entities/product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface IProductRepository {
  findAll(categoryId?: string): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  create(data: {
    categoryId: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
  }): Promise<Product>;
  update(
    id: string,
    data: Partial<{
      name: string;
      price: number;
      description: string;
      imageUrl: string;
      isAvailable: boolean;
      categoryId: string;
    }>,
  ): Promise<Product>;
  delete(id: string): Promise<void>;
}
