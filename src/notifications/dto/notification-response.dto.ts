import { Expose, Transform } from 'class-transformer';
import { NotificationType } from './create-notification.dto';

export class NotificationResponseDto {
  @Expose()
  _id: string;

  @Expose()
  userId: string;

  @Expose()
  title: string;

  @Expose()
  message: string;

  @Expose()
  type: NotificationType;

  @Expose()
  read: boolean;

  @Expose()
  data?: any;

  @Expose()
  @Transform(({ value }) => new Date(value))
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => new Date(value))
  updatedAt: Date;

  constructor(partial: Partial<NotificationResponseDto>) {
    Object.assign(this, partial);
  }
}
