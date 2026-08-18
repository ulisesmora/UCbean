import { Inject, Injectable } from '@nestjs/common';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';

@Injectable()
export class ListCategoriesUseCase {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly categories: ICategoryRepository) {}

  execute(): Promise<Category[]> {
    return this.categories.findAll();
  }
}
