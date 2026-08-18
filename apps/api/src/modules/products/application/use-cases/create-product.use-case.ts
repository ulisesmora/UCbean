import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/repositories/product.repository.interface';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../domain/repositories/category.repository.interface';
import { Product } from '../../domain/entities/product.entity';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository,
    @Inject(CATEGORY_REPOSITORY) private readonly categories: ICategoryRepository,
  ) {}

  async execute(data: {
    categoryId: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
  }): Promise<Product> {
    const cat = await this.categories.findById(data.categoryId);
    if (!cat) throw new NotFoundException(`Category ${data.categoryId} not found`);
    return this.products.create(data);
  }
}
