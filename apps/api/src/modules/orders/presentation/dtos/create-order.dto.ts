import {
  IsEnum,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  IsString,
  IsDateString,
  IsIn,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  DrinkBuild,
  DrinkSize,
  Foam,
  LatteArt,
  Serve,
  Vessel,
} from '../../domain/value-objects/drink-build';

/**
 * The formula for one drink.
 *
 * Mirrors `apps/web/src/lib/builder.ts`, which is where the ids come from: the
 * configurator produces this object, the 3D preview renders it, and it is
 * stored verbatim on the order line. Only the shape is enforced here. Whether
 * `beans` names a coffee we actually stock is the catalogue's business, and the
 * free-text ids are capped so a client cannot push arbitrary bulk into the
 * JSON column.
 */
export class DrinkBuildDto implements DrinkBuild {
  @ApiProperty({ example: 'ethiopia', description: 'Origin and roast' })
  @IsString()
  @MaxLength(64)
  beans: string;

  @ApiProperty({ enum: ['small', 'medium', 'large'] })
  @IsIn(['small', 'medium', 'large'])
  size: DrinkSize;

  @ApiProperty({ example: 'latte', description: 'Espresso, filter, latte, matcha…' })
  @IsString()
  @MaxLength(64)
  base: string;

  @ApiProperty({ enum: ['hot', 'iced', 'blended'] })
  @IsIn(['hot', 'iced', 'blended'])
  serve: Serve;

  @ApiProperty({ example: 'oat', description: '"none" for a black coffee' })
  @IsString()
  @MaxLength(64)
  milk: string;

  @ApiProperty({ enum: ['micro', 'cappuccino', 'flat', 'dollop'] })
  @IsIn(['micro', 'cappuccino', 'flat', 'dollop'])
  foam: Foam;

  @ApiProperty({ enum: ['none', 'heart', 'rosetta', 'tulip', 'swan'] })
  @IsIn(['none', 'heart', 'rosetta', 'tulip', 'swan'])
  art: LatteArt;

  @ApiProperty({ example: ['sugar', 'cinnamon'], type: [String] })
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  extras: string[];

  @ApiProperty({ enum: ['togo', 'here', 'glass'] })
  @IsIn(['togo', 'here', 'glass'])
  vessel: Vessel;

  @ApiProperty({ example: 'kraft', description: 'Sleeve or cup finish' })
  @IsString()
  @MaxLength(64)
  sleeve: string;
}

export class OrderItemInputDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  qty: number;

  @ApiPropertyOptional({ type: DrinkBuildDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DrinkBuildDto)
  build?: DrinkBuildDto;

  @ApiPropertyOptional({
    example: 'hojicha-latte',
    description: 'Menu recipe this came from, omitted when the customer built it',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  recipeId?: string;

  @ApiPropertyOptional({ example: 'Hojicha Latte', description: 'What the customer was shown' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Medium · hot · oat · rosetta' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  ticket?: string;
}

export class CreateOrderDto {
  @ApiProperty({ enum: ['PICKUP', 'DELIVERY', 'TABLE'], example: 'PICKUP' })
  @IsEnum(['PICKUP', 'DELIVERY', 'TABLE'])
  type: 'PICKUP' | 'DELIVERY' | 'TABLE';

  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @ApiPropertyOptional({
    example: '2026-09-12T15:30:00.000Z',
    description: 'Collection time, required for PICKUP. Must be one of the listed slots.',
  })
  @IsOptional()
  @IsDateString()
  slotTime?: string;

  @ApiProperty({ example: 'Extra oat milk please', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  deliveryAddressId?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] })
  @IsEnum(['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])
  status: 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

  @ApiProperty({ example: 'Customer picked up', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
