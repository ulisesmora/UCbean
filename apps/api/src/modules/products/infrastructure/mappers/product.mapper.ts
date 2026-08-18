import { plainToInstance } from 'class-transformer';
import { Product } from '../../domain/entities/product.entity';
import { Category } from '../../domain/entities/category.entity';
import {
  ProductResponseDto,
  CategoryResponseDto,
} from '../../presentation/dtos/product-response.dto';

export class ProductMapper {
  static toResponse(entity: Product): ProductResponseDto {
    return plainToInstance(ProductResponseDto, entity, { excludeExtraneousValues: true });
  }

  static toResponseList(entities: Product[]): ProductResponseDto[] {
    return entities.map((e) => ProductMapper.toResponse(e));
  }
}

export class CategoryMapper {
  static toResponse(entity: Category): CategoryResponseDto {
    return plainToInstance(CategoryResponseDto, entity, { excludeExtraneousValues: true });
  }

  static toResponseList(entities: Category[]): CategoryResponseDto[] {
    return entities.map((e) => CategoryMapper.toResponse(e));
  }
}
