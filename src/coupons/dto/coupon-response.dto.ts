import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CouponResponseDto {
  @ApiProperty({ description: 'ID único del cupón', example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ description: 'Código único del cupón', example: 'SUMMER2024' })
  code: string;

  @ApiProperty({ description: 'Código QR del cupón', example: 'qr_code_data_here' })
  qrCode: string;

  @ApiProperty({ description: 'Valor del descuento', example: 15 })
  discount: number;

  @ApiProperty({ 
    description: 'Tipo de descuento', 
    enum: ['PERCENTAGE', 'FIXED'],
    example: 'PERCENTAGE'
  })
  type: 'PERCENTAGE' | 'FIXED';

  @ApiPropertyOptional({ description: 'Monto mínimo para aplicar el cupón', example: 50 })
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Número máximo de usos', example: 100 })
  maxUses?: number;

  @ApiProperty({ description: 'Número de veces usado', example: 5 })
  usedCount: number;

  @ApiPropertyOptional({ description: 'Fecha de expiración', example: '2024-12-31T23:59:59.000Z' })
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'ID del usuario específico (si es personalizado)', example: '507f1f77bcf86cd799439011' })
  userId?: string;

  @ApiProperty({ description: 'Estado activo del cupón', example: true })
  active: boolean;

  @ApiProperty({ description: 'Fecha de creación', example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización', example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
} 