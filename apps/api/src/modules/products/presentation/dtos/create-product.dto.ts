import {
  Matches,
  MaxLength,
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
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

  @ApiProperty({ example: '/uploads/a3/a3f2…webp', required: false })
  @IsOptional()
  @IsString()
  // Acepta la ruta que devuelve /uploads/image y también una URL entera,
  // por si algún día las fotos se sirven desde otro sitio. `@IsUrl` solo
  // admitía lo segundo y rechazaba justo lo que sube el CRM.
  @Matches(/^(https?:\/\/\S+|\/uploads\/[\w./-]+)$/, {
    message: 'The image must be a URL or an /uploads path',
  })
  @MaxLength(500)
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
  @IsString()
  @Matches(/^(https?:\/\/\S+|\/uploads\/[\w./-]+)$/, {
    message: 'The image must be a URL or an /uploads path',
  })
  @MaxLength(500)
  imageUrl?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
