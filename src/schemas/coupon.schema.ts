import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true, unique: true })
  qrCode: string;

  @Prop({ required: true })
  discount: number;

  @Prop({
    required: true,
    enum: ['PERCENTAGE', 'FIXED'],
  })
  type: string;

  @Prop()
  minAmount?: number;

  @Prop()
  maxUses?: number;

  @Prop({ default: 0 })
  usedCount: number;

  @Prop()
  expiresAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ default: true })
  active: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
