import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CategoriesService } from './categories.service';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
  ProductResponseDto,
} from './dto';
import { CreateCategoryDto, UpdateCategoryDto, CategoryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  // ========================================
  // PRODUCT ENDPOINTS
  // ========================================

  /**
   * Crear un nuevo producto (requiere autenticación)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.create(createProductDto);
  }

  /**
   * Obtener todos los productos con filtros, búsqueda y paginación
   * 
   * Query parameters:
   * - page: Número de página (default: 1)
   * - limit: Elementos por página (default: 10)
   * - category: ID de categoría para filtrar
   * - available: Filtrar por disponibilidad (true/false)
   * - sort: Campo para ordenar (name, price, createdAt)
   * - order: Orden (asc, desc)
   * - search: Término de búsqueda en nombre, descripción e ingredientes
   * - minPrice: Precio mínimo
   * - maxPrice: Precio máximo
   */
  @Get()
  async findAll(@Query() queryDto: QueryProductDto) {
    return this.productsService.findAll(queryDto);
  }

  /**
   * Obtener solo productos disponibles
   */
  @Get('available')
  async getAvailableProducts(): Promise<ProductResponseDto[]> {
    return this.productsService.getAvailableProducts();
  }

  /**
   * Buscar productos por término de búsqueda
   * Busca en nombre, descripción e ingredientes
   */
  @Get('search')
  async searchProducts(
    @Query('q') searchTerm: string,
  ): Promise<ProductResponseDto[]> {
    return this.productsService.searchProducts(searchTerm);
  }

  /**
   * Búsqueda avanzada con múltiples criterios
   * 
   * Query parameters:
   * - search: Término de búsqueda
   * - category: ID de categoría
   * - minPrice/maxPrice: Rango de precios
   * - minCalories/maxCalories: Rango de calorías
   * - dietary: Filtro dietético (vegan, vegetarian, gluten-free, dairy-free)
   * - available: Disponibilidad
   * - sort: Campo para ordenar
   * - order: Orden (asc, desc)
   * - limit: Límite de resultados
   */
  @Get('search/advanced')
  async advancedSearch(
    @Query() criteria: {
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
    },
  ): Promise<ProductResponseDto[]> {
    return this.productsService.advancedSearch(criteria);
  }

  /**
   * Obtener productos por categoría
   */
  @Get('category/:categoryId')
  async findByCategory(
    @Param('categoryId') categoryId: string,
  ): Promise<ProductResponseDto[]> {
    return this.productsService.findByCategory(categoryId);
  }

  /**
   * Obtener un producto por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productsService.findOne(id);
  }

  /**
   * Actualizar un producto (requiere autenticación)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * Actualizar disponibilidad de un producto (requiere autenticación)
   */
  @Patch(':id/availability')
  @UseGuards(JwtAuthGuard)
  async updateAvailability(
    @Param('id') id: string,
    @Body('available') available: boolean,
  ): Promise<ProductResponseDto> {
    return this.productsService.updateAvailability(id, available);
  }

  /**
   * Eliminar un producto (requiere autenticación)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // ========================================
  // CATEGORY ENDPOINTS
  // ========================================

  /**
   * Crear una nueva categoría (requiere autenticación)
   */
  @Post('categories')
  @UseGuards(JwtAuthGuard)
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryDto> {
    return this.categoriesService.create(createCategoryDto);
  }

  /**
   * Obtener todas las categorías
   */
  @Get('categories')
  async findAllCategories(): Promise<CategoryDto[]> {
    return this.categoriesService.findAll();
  }

  /**
   * Obtener categorías con conteo de productos
   */
  @Get('categories/with-counts')
  async getCategoriesWithCounts() {
    return this.categoriesService.getCategoriesWithProductCount();
  }

  /**
   * Obtener una categoría por ID
   */
  @Get('categories/:id')
  async findOneCategory(@Param('id') id: string): Promise<CategoryDto> {
    return this.categoriesService.findOne(id);
  }

  /**
   * Actualizar una categoría (requiere autenticación)
   */
  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard)
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  /**
   * Eliminar una categoría (requiere autenticación)
   */
  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeCategory(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
