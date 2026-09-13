import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
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
}

export class UpdateRecipeDto extends CreateRecipeDto {}
