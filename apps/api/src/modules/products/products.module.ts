import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository.interface';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository.interface';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository';
import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { ProductsController } from './presentation/controllers/products.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
    ListProductsUseCase,
    ListCategoriesUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
  ],
  exports: [PRODUCT_REPOSITORY, CATEGORY_REPOSITORY],
})
export class ProductsModule {}
