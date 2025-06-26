import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PasswordResetDocument = PasswordReset & Document;

@Schema({ timestamps: true })
export class PasswordReset {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  used: boolean;

  @Prop()
  usedAt?: Date;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);

// Índices para optimizar consultas
PasswordResetSchema.index({ email: 1 });
PasswordResetSchema.index({ token: 1 });
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index 