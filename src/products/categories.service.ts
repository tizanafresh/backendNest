import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto, CategoryDto } from './dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
    this.logger.log(`Creating category: ${createCategoryDto.name}`);

    // Check if category with same name already exists
    const existingCategory = await this.categoryModel.findOne({
      name: { $regex: new RegExp(`^${createCategoryDto.name}$`, 'i') },
    });

    if (existingCategory) {
      throw new BadRequestException(
        `Category with name "${createCategoryDto.name}" already exists`,
      );
    }

    const category = new this.categoryModel(createCategoryDto);
    const savedCategory = await category.save();

    return this.transformToResponseDto(savedCategory);
  }

  async findAll(): Promise<CategoryDto[]> {
    this.logger.log('Finding all categories');

    const categories = await this.categoryModel.find().sort({ name: 1 }).exec();

    return categories.map((category) => this.transformToResponseDto(category));
  }

  async findOne(id: string): Promise<CategoryDto> {
    this.logger.log(`Finding category with ID: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    const category = await this.categoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.transformToResponseDto(category);
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    this.logger.log(`Updating category with ID: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    // Check if category exists
    const existingCategory = await this.categoryModel.findById(id);
    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check for name conflicts if name is being updated
    if (
      updateCategoryDto.name &&
      updateCategoryDto.name !== existingCategory.name
    ) {
      const nameConflict = await this.categoryModel.findOne({
        name: { $regex: new RegExp(`^${updateCategoryDto.name}$`, 'i') },
        _id: { $ne: id },
      });
      if (nameConflict) {
        throw new BadRequestException(
          `Category with name "${updateCategoryDto.name}" already exists`,
        );
      }
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.transformToResponseDto(updatedCategory);
  }

  async remove(id: string): Promise<{
    message: string;
    deletedCategory: { id: string; name: string };
  }> {
    this.logger.log(`Removing category with ID: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if category has products
    const { default: mongoose } = await import('mongoose');
    const Product = mongoose.model('Product');
    const productCount = await Product.countDocuments({ category: id });

    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because it has ${productCount} associated products`,
      );
    }

    await this.categoryModel.findByIdAndDelete(id);

    return {
      message: 'Category deleted successfully',
      deletedCategory: {
        id: (category._id as Types.ObjectId).toString(),
        name: category.name,
      },
    };
  }

  async findByName(name: string): Promise<CategoryDto | null> {
    this.logger.log(`Finding category by name: ${name}`);

    const category = await this.categoryModel
      .findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
      .exec();

    return category ? this.transformToResponseDto(category) : null;
  }

  async getCategoriesWithProductCount(): Promise<
    Array<CategoryDto & { productCount: number }>
  > {
    this.logger.log('Finding categories with product counts');

    const categories = await this.categoryModel.find().sort({ name: 1 }).exec();

    const { default: mongoose } = await import('mongoose');
    const Product = mongoose.model('Product');

    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({
          category: category._id,
        });
        return {
          ...this.transformToResponseDto(category),
          productCount,
        };
      }),
    );

    return categoriesWithCounts;
  }

  private transformToResponseDto(category: CategoryDocument): CategoryDto {
    return plainToClass(CategoryDto, category.toObject(), {
      excludeExtraneousValues: true,
    });
  }
}
