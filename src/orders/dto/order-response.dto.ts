import { Expose, Transform, Type } from 'class-transformer';
import { OrderStatus } from './update-order.dto';

export class OrderItemResponseDto {
  @Expose()
  productId: string;

  @Expose()
  name: string;

  @Expose()
  quantity: number;

  @Expose()
  price: number;

  @Expose()
  notes?: string;
}

export class DeliveryAddressResponseDto {
  @Expose()
  street: string;

  @Expose()
  city: string;

  @Expose()
  zipCode: string;

  @Expose()
  instructions?: string;
}

export class OrderResponseDto {
  @Expose()
  _id: string;

  @Expose()
  userId: string;

  @Expose()
  @Type(() => OrderItemResponseDto)
  items: OrderItemResponseDto[];

  @Expose()
  total: number;

  @Expose()
  discount: number;

  @Expose()
  finalTotal: number;

  @Expose()
  status: OrderStatus;

  @Expose()
  couponId?: string;

  @Expose()
  @Type(() => DeliveryAddressResponseDto)
  deliveryAddress?: DeliveryAddressResponseDto;

  @Expose()
  @Transform(({ value }) => value?.toISOString?.() || undefined)
  createdAt?: Date;

  @Expose()
  @Transform(({ value }) => value?.toISOString?.() || undefined)
  updatedAt?: Date;
} 