import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class BenefitDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  discountPercentage: number;

  @IsOptional()
  @IsNumber()
  minPointsRequired?: number;

  @IsOptional()
  @IsString()
  code?: string;
}

export class LevelBenefitsDto {
  @IsString()
  level: string;

  @IsArray()
  benefits: BenefitDto[];

  @IsNumber()
  pointsRequired: number;

  @IsString()
  description: string;
}

export class UserBenefitsDto {
  @IsString()
  userId: string;

  @IsString()
  currentLevel: string;

  @IsArray()
  availableBenefits: BenefitDto[];

  @IsArray()
  nextLevelBenefits: BenefitDto[];

  @IsNumber()
  pointsToNextLevel: number;
} 