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
  /** Nombre de la sección de la carta. La web lo usa para saber si es una bebida. */
  @Expose() category: { id: string; name: string } | null;
}
