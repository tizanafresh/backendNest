import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, IsEnum, Min, Max } from 'class-validator';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsString()
  description: string;

  @IsEnum(['PERCENTAGE', 'FIXED_AMOUNT'])
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validTo: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  category?: string;
} 