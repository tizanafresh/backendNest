import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    required: true,
    enum: ["ORDER", "ORDER_STATUS", "PROMOTION", "SYSTEM", "LOYALTY"],
    default: "SYSTEM",
  })
  type: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: Object })
  data?: any;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
