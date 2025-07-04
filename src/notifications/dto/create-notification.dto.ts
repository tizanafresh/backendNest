import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum NotificationType {
  ORDER = 'ORDER',
  ORDER_STATUS = 'ORDER_STATUS',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
  LOYALTY = 'LOYALTY',
}

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType = NotificationType.SYSTEM;

  @IsBoolean()
  @IsOptional()
  read?: boolean = false;

  @IsOptional()
  data?: any;
}
