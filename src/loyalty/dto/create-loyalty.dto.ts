import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsMongoId, Min } from 'class-validator';

export enum LoyaltyType {
  EARNED = 'EARNED',
  SPENT = 'SPENT',
  BONUS = 'BONUS',
  PROMOTION = 'PROMOTION',
}

export class CreateLoyaltyDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsEnum(LoyaltyType)
  @IsNotEmpty()
  type: LoyaltyType;

  @IsNumber()
  @Min(1)
  points: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsMongoId()
  @IsOptional()
  orderId?: string;
} 