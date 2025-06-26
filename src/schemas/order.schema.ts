import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop([
    {
      productId: { type: Types.ObjectId, ref: 'Product' },
      name: String,
      quantity: Number,
      price: Number,
      notes: String,
    },
  ])
  items: Array<{
    productId: Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;

  @Prop({ required: true })
  total: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ required: true })
  finalTotal: number;

  @Prop({
    required: true,
    enum: [
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY',
      'DELIVERED',
      'CANCELLED',
    ],
    default: 'PENDING',
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Coupon' })
  couponId?: Types.ObjectId;

  @Prop({ type: Object })
  deliveryAddress?: {
    street: string;
    city: string;
    zipCode: string;
    instructions?: string;
  };
}

export const OrderSchema = SchemaFactory.createForClass(Order);
