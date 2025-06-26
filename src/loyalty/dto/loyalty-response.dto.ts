import { Expose, Transform } from 'class-transformer';
import { LoyaltyType } from './create-loyalty.dto';

export class LoyaltyResponseDto {
  @Expose()
  _id: string;

  @Expose()
  userId: string;

  @Expose()
  type: LoyaltyType;

  @Expose()
  points: number;

  @Expose()
  description: string;

  @Expose()
  orderId?: string;

  @Expose()
  @Transform(({ value }) => value?.toISOString?.() || undefined)
  createdAt?: Date;

  @Expose()
  @Transform(({ value }) => value?.toISOString?.() || undefined)
  updatedAt?: Date;
} 