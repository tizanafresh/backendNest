import { IsString, IsNumber, IsOptional } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  code: string;

  @IsNumber()
  @IsOptional()
  orderAmount?: number;

  @IsString()
  @IsOptional()
  userId?: string;
} 