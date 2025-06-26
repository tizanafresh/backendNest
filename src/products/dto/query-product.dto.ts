import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsMongoId,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryProductDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  available?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['name', 'price', 'createdAt', 'popularity', 'calories'])
  sort?: string = 'name';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: string = 'asc';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minCalories?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxCalories?: number;

  @IsOptional()
  @IsString()
  @IsIn(['all', 'vegan', 'vegetarian', 'gluten-free', 'dairy-free'])
  dietary?: string;
}
