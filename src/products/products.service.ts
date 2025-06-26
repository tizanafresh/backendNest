import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
  ProductResponseDto,
} from './dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    this.logger.log(`Creating product: ${createProductDto.name}`);

    // Validate category exists
    const category = await this.categoryModel.findById(
      createProductDto.category,
    );
    if (!category) {
      throw new BadRequestException(
        `Category with ID ${createProductDto.category} not found`,
      );
    }

    // Check if product with same name already exists
    const existingProduct = await this.productModel.findOne({
      name: createProductDto.name,
    });
    if (existingProduct) {
      throw new BadRequestException(
        `Product with name "${createProductDto.name}" already exists`,
      );
    }

    const product = new this.productModel(createProductDto);
    const savedProduct = await product.save();

    // Populate category and transform to response DTO
    const populatedProduct = await this.productModel
      .findById(savedProduct._id)
      .populate('category', 'name description')
      .exec();

    if (!populatedProduct) {
      throw new NotFoundException('Product was not found after creation');
    }

    return this.transformToResponseDto(populatedProduct);
  }

  async findAll(queryDto: QueryProductDto): Promise<{
    products: ProductResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    filters: Partial<QueryProductDto>;
  }> {
    this.logger.log('Finding all products with filters');

    const {
      page = 1,
      limit = 10,
      category,
      available,
      sort = 'name',
      order = 'asc',
      search,
      minPrice,
      maxPrice,
      minCalories,
      maxCalories,
      dietary,
    } = queryDto;

    // Build filter object
    const filter: any = {};

    if (category) {
      filter.category = new Types.ObjectId(category);
    }

    if (available !== undefined) {
      filter.available = available;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ingredients: { $regex: search, $options: 'i' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    if (minCalories !== undefined || maxCalories !== undefined) {
      filter.nutritionalInfo = filter.nutritionalInfo || {};
      filter.nutritionalInfo.calories = {};
      if (minCalories !== undefined) filter.nutritionalInfo.calories.$gte = minCalories;
      if (maxCalories !== undefined) filter.nutritionalInfo.calories.$lte = maxCalories;
    }

    if (dietary && dietary !== 'all') {
      filter.dietaryInfo = {};
      switch (dietary) {
        case 'vegan':
          filter.dietaryInfo.vegan = true;
          break;
        case 'vegetarian':
          filter.dietaryInfo.vegetarian = true;
          break;
        case 'gluten-free':
          filter.dietaryInfo.glutenFree = true;
          break;
        case 'dairy-free':
          filter.dietaryInfo.dairyFree = true;
          break;
      }
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await this.productModel.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    // Execute query
    const products = await this.productModel
      .find(filter)
      .populate('category', 'name description')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .exec();

    // Transform to response DTOs
    const transformedProducts = products.map((product) =>
      this.transformToResponseDto(product),
    );

    return {
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
      filters: {
        category,
        available,
        sort,
        order,
        search,
        minPrice,
        maxPrice,
        minCalories,
        maxCalories,
        dietary,
      },
    };
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    this.logger.log(`Finding product with ID: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const product = await this.productModel
      .findById(id)
      .populate('category', 'name description')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.transformToResponseDto(product);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    this.logger.log(`Updating product with ID: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    // Check if product exists
    const existingProduct = await this.productModel.findById(id);
    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Validate category if being updated
    if (updateProductDto.category) {
      const category = await this.categoryModel.findById(
        updateProductDto.category,
      );
      if (!category) {
        throw new BadRequestException(
          `Category with ID ${updateProductDto.category} not found`,
        );
      }
    }

    // Check for name conflicts if name is being updated
    if (
      updateProductDto.name &&
      updateProductDto.name !== existingProduct.name
    ) {
      const nameConflict = await this.productModel.findOne({
        name: updateProductDto.name,
        _id: { $ne: id },
      });
      if (nameConflict) {
        throw new BadRequestException(
          `Product with name "${updateProductDto.name}" already exists`,
        );
      }
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, {
        new: true,
        runValidators: true,
      })
      .populate('category', 'name description')
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.transformToResponseDto(updatedProduct);
  }

  async remove(id: string): Promise<{
    message: string;
    deletedProduct: { id: string; name: string };
  }> {
    this.logger.log(`Removing product with ID: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.productModel.findByIdAndDelete(id);

    return {
      message: 'Product deleted successfully',
      deletedProduct: {
        id: (product._id as Types.ObjectId).toString(),
        name: product.name,
      },
    };
  }

  async findByCategory(categoryId: string): Promise<ProductResponseDto[]> {
    this.logger.log(`Finding products by category: ${categoryId}`);

    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('Invalid category ID format');
    }

    const products = await this.productModel
      .find({ category: categoryId, available: true })
      .populate('category', 'name description')
      .sort({ name: 1 })
      .exec();

    return products.map((product) => this.transformToResponseDto(product));
  }

  async searchProducts(searchTerm: string): Promise<ProductResponseDto[]> {
    this.logger.log(`Searching products with term: ${searchTerm}`);

    const products = await this.productModel
      .find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { ingredients: { $regex: searchTerm, $options: 'i' } },
        ],
      })
      .populate('category', 'name description')
      .sort({ name: 1 })
      .exec();

    return products.map((product) => this.transformToResponseDto(product));
  }

  async getAvailableProducts(): Promise<ProductResponseDto[]> {
    this.logger.log('Finding all available products');

    const products = await this.productModel
      .find({ available: true })
      .populate('category', 'name description')
      .sort({ name: 1 })
      .exec();

    return products.map((product) => this.transformToResponseDto(product));
  }

  async updateAvailability(
    id: string,
    available: boolean,
  ): Promise<ProductResponseDto> {
    this.logger.log(`Updating availability for product ${id} to ${available}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const product = await this.productModel
      .findByIdAndUpdate(id, { available }, { new: true, runValidators: true })
      .populate('category', 'name description')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.transformToResponseDto(product);
  }

  /**
   * Búsqueda avanzada con múltiples criterios
   */
  async advancedSearch(criteria: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minCalories?: number;
    maxCalories?: number;
    dietary?: string;
    available?: boolean;
    sort?: string;
    order?: 'asc' | 'desc';
    limit?: number;
  }): Promise<ProductResponseDto[]> {
    this.logger.log('Performing advanced search with criteria:', criteria);

    const {
      search,
      category,
      minPrice,
      maxPrice,
      minCalories,
      maxCalories,
      dietary,
      available,
      sort = 'name',
      order = 'asc',
      limit = 20,
    } = criteria;

    // Build filter object
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ingredients: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = new Types.ObjectId(category);
    }

    if (available !== undefined) {
      filter.available = available;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    if (minCalories !== undefined || maxCalories !== undefined) {
      filter.nutritionalInfo = filter.nutritionalInfo || {};
      filter.nutritionalInfo.calories = {};
      if (minCalories !== undefined) filter.nutritionalInfo.calories.$gte = minCalories;
      if (maxCalories !== undefined) filter.nutritionalInfo.calories.$lte = maxCalories;
    }

    if (dietary && dietary !== 'all') {
      filter.dietaryInfo = {};
      switch (dietary) {
        case 'vegan':
          filter.dietaryInfo.vegan = true;
          break;
        case 'vegetarian':
          filter.dietaryInfo.vegetarian = true;
          break;
        case 'gluten-free':
          filter.dietaryInfo.glutenFree = true;
          break;
        case 'dairy-free':
          filter.dietaryInfo.dairyFree = true;
          break;
      }
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    const products = await this.productModel
      .find(filter)
      .populate('category', 'name description')
      .sort(sortObj)
      .limit(limit)
      .exec();

    return products.map((product) => this.transformToResponseDto(product));
  }

  private transformToResponseDto(product: ProductDocument): ProductResponseDto {
    return plainToClass(ProductResponseDto, product.toObject(), {
      excludeExtraneousValues: true,
    });
  }
}
