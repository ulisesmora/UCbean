import { Inject, Injectable } from '@nestjs/common';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';

@Injectable()
export class ListProductsUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository) {}

  execute(categoryId?: string): Promise<Product[]> {
    return this.products.findAll(categoryId);
  }
}
