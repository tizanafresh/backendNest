import { Expose, Transform } from 'class-transformer';
import { CategoryDto } from './category.dto';

export class NutritionalInfoResponseDto {
  @Expose()
  calories?: number;

  @Expose()
  protein?: number;

  @Expose()
  carbs?: number;

  @Expose()
  fat?: number;

  @Expose()
  fiber?: number;
}

export class ProductResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  price: number;

  @Expose()
  @Transform(({ obj }) =>
    obj.category
      ? {
          id: obj.category._id || obj.category,
          name: obj.category.name,
          description: obj.category.description,
        }
      : null,
  )
  category: CategoryDto;

  @Expose()
  image?: string;

  @Expose()
  available: boolean;

  @Expose()
  ingredients?: string[];

  @Expose()
  nutritionalInfo?: NutritionalInfoResponseDto;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
