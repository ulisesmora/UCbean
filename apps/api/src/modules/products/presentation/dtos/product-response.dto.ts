import { Expose, Type } from 'class-transformer';

export class CategoryResponseDto {
  @Expose() id: string;
  @Expose() name: string;
}

export class ProductResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() price: number;
  @Expose() description: string | null;
  @Expose() imageUrl: string | null;
  @Expose() isAvailable: boolean;
  @Expose() categoryId: string;
}
