import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    required: true,
    enum: ["PERCENTAGE", "FIXED_AMOUNT"],
  })
  discountType: string;

  @Prop({ required: true })
  discountValue: number;

  @Prop()
  minOrderAmount?: number;

  @Prop()
  maxDiscount?: number;

  @Prop({ required: true })
  validFrom: Date;

  @Prop({ required: true })
  validTo: Date;

  @Prop()
  maxUses?: number;

  @Prop({ default: 0 })
  currentUses: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  category?: string;

  @Prop()
  qrCode?: string;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
