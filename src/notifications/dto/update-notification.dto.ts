import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class UpdateNotificationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsEnum(['ORDER', 'PROMOTION', 'SYSTEM', 'LOYALTY'])
  @IsOptional()
  type?: 'ORDER' | 'PROMOTION' | 'SYSTEM' | 'LOYALTY';

  @IsBoolean()
  @IsOptional()
  read?: boolean;
} 