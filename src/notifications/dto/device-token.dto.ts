import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class DeviceTokenDto {
  @IsString()
  userId: string;

  @IsString()
  token: string;

  @IsEnum(['IOS', 'ANDROID', 'WEB'])
  @IsOptional()
  platform?: 'IOS' | 'ANDROID' | 'WEB' = 'ANDROID';

  @IsBoolean()
  @IsOptional()
  active?: boolean = true;
} 