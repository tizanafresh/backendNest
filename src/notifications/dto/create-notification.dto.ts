import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(['ORDER', 'PROMOTION', 'SYSTEM', 'LOYALTY'])
  @IsOptional()
  type?: 'ORDER' | 'PROMOTION' | 'SYSTEM' | 'LOYALTY' = 'SYSTEM';

  @IsBoolean()
  @IsOptional()
  read?: boolean = false;
} 