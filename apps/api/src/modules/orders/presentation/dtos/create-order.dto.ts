import {
  IsEnum,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemInputDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  qty: number;
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
