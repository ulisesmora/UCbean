import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PreviewDiscountDto {
  @ApiProperty({ example: 'HOLA7KQP2' })
  @IsString()
  @MaxLength(40)
  code: string;

  @ApiProperty({ example: 12.5, description: 'Order total before the discount' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  orderTotal: number;
}

export class CreateDiscountDto {
  @ApiProperty({ example: 'REGRESOACLASES' })
  @IsString()
  @MaxLength(40)
  code: string;

  @ApiProperty({ example: '15% during the first week of classes' })
  @IsString()
  @MaxLength(240)
  description: string;

  @ApiProperty({ enum: ['PERCENT', 'AMOUNT'] })
  @IsIn(['PERCENT', 'AMOUNT'])
  kind: 'PERCENT' | 'AMOUNT';

  @ApiProperty({ example: 15 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minOrderTotal?: number;

  @ApiPropertyOptional({ example: 200, description: 'Tope global de usos' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxRedemptions?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  perUserLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
