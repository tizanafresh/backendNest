import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LoyaltyHistoryDocument = LoyaltyHistory & Document;

@Schema({ timestamps: true })
export class LoyaltyHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ 
    required: true, 
    enum: ['EARNED', 'SPENT', 'BONUS', 'PROMOTION'],
    default: 'EARNED'
  })
  type: string;

  @Prop({ required: true })
  points: number;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;
}

export const LoyaltyHistorySchema = SchemaFactory.createForClass(LoyaltyHistory); 