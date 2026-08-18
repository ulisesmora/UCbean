import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';

@Injectable()
export class UpdateProductUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository) {}

  async execute(
    id: string,
    data: Partial<{
      name: string;
      price: number;
      description: string;
      imageUrl: string;
      isAvailable: boolean;
      categoryId: string;
    }>,
  ): Promise<Product> {
    const existing = await this.products.findById(id);
    if (!existing) throw new NotFoundException(`Product ${id} not found`);
    return this.products.update(id, data);
  }
}
