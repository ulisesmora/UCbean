import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  IsUrl,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'Yuzu Americano' })
  @IsString()
  name: string;

  @ApiProperty({ example: 5.5 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 'Yuzu citrus + espresso + sparkling water', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://cdn.ucbean.ca/yuzu.webp', required: false })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'Yuzu Americano', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 5.5, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
