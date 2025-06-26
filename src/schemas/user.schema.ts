import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  phone?: string;

  @Prop({ default: 0 })
  points: number;

  @Prop({ 
    required: true, 
    enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
    default: 'BRONZE'
  })
  level: string;

  @Prop({ required: true, unique: true })
  qrCode: string;
}

export const UserSchema = SchemaFactory.createForClass(User); 