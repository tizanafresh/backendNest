export class CouponResponseDto {
  _id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validFrom: Date;
  validTo: Date;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  category?: string;
  qrCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 