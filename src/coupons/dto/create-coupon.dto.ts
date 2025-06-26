import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty({ description: 'Código único del cupón', example: 'SUMMER2024' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Código QR del cupón', example: 'qr_code_data_here' })
  @IsString()
  qrCode: string;

  @ApiProperty({ description: 'Valor del descuento', example: 15 })
  @IsNumber()
  @Min(0)
  discount: number;

  @ApiProperty({ 
    description: 'Tipo de descuento', 
    enum: ['PERCENTAGE', 'FIXED'],
    example: 'PERCENTAGE'
  })
  @IsEnum(['PERCENTAGE', 'FIXED'])
  type: 'PERCENTAGE' | 'FIXED';

  @ApiPropertyOptional({ description: 'Monto mínimo para aplicar el cupón', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Número máximo de usos', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Fecha de expiración', example: '2024-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'ID del usuario específico (si es personalizado)', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Estado activo del cupón', example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
} 