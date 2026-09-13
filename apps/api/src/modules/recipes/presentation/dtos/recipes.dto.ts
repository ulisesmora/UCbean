import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DrinkBuildDto } from '../../../orders/presentation/dtos/create-order.dto';

export class CreateRecipeDto {
  @ApiProperty({ example: 'hojicha-latte', description: 'Viaja en OrderItem.recipeId' })
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'The slug is lowercase with hyphens, like hojicha-latte',
  })
  @MaxLength(64)
  slug: string;

  @ApiProperty({ example: 'Hojicha Latte' })
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: 'ほうじ茶' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  accent?: string;

  @ApiProperty({ enum: ['SIGNATURE', 'SEASONAL'] })
  @IsIn(['SIGNATURE', 'SEASONAL'])
  kind: 'SIGNATURE' | 'SEASONAL';

  @ApiProperty({ example: 'Te verde tostado y leche de avena. Tostado, poca cafeina.' })
  @IsString()
  @MaxLength(240)
  note: string;

  @ApiProperty({ type: DrinkBuildDto })
  @ValidateNested()
  @Type(() => DrinkBuildDto)
  build: DrinkBuildDto;

  @ApiPropertyOptional({ example: 'Otono' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  season?: string;

  @ApiPropertyOptional({ description: 'Desde cuando se sirve. Vacio significa siempre.' })
  @IsOptional()
  @IsDateString()
  activeFrom?: string;

  @ApiPropertyOptional({ description: 'Hasta cuando. Vacio significa siempre.' })
  @IsOptional()
  @IsDateString()
  activeTo?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Menu section it is sold under. Blank means Signature Drinks or Seasonal Drinks.',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Fixed menu price. null charges the sum of its ingredients.',
  })
  @IsOptional()
  // A save from the counter app may send back the figure as text ("6.00").
  @Transform(({ value }) =>
    value === null || value === undefined || value === '' ? null : Number(value),
  )
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceOverride?: number | null;

  @ApiPropertyOptional({ description: 'Photo for its menu card. null removes it.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string | null;
}

export class UpdateRecipeDto extends CreateRecipeDto {}
