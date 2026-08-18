import { plainToInstance, Expose, Type } from 'class-transformer';
import { OrderEntity, OrderItemEntity } from '../../domain/entities/order.entity';

export class OrderItemResponseDto {
  @Expose() id: string;
  @Expose() productId: string;
  @Expose() qty: number;
  @Expose() unitPrice: number;
  @Expose() subtotal: number;
}

export class OrderResponseDto {
  @Expose() id: string;
  @Expose() userId: string;
  @Expose() type: string;
  @Expose() status: string;
  @Expose() total: number;
  @Expose() notes: string | null;
  @Expose() deliveryAddressId: string | null;
  @Expose() createdAt: Date;

  @Expose()
  @Type(() => OrderItemResponseDto)
  items: OrderItemResponseDto[];
}

export class OrderMapper {
  static toResponse(entity: OrderEntity): OrderResponseDto {
    const plain = {
      ...entity,
      items: entity.items.map((i) => ({ ...i, subtotal: i.subtotal })),
    };
    return plainToInstance(OrderResponseDto, plain, { excludeExtraneousValues: true });
  }

  static toResponseList(entities: OrderEntity[]): OrderResponseDto[] {
    return entities.map((e) => OrderMapper.toResponse(e));
  }
}
