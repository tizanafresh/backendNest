import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  image?: string;

  @Prop({ default: true })
  active: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category); 