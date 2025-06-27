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
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto, CouponResponseDto } from './dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  /**
   * Crear un nuevo cupón (solo admin)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createCouponDto: CreateCouponDto): Promise<CouponResponseDto> {
    return this.couponsService.create(createCouponDto);
  }

  /**
   * Obtener todos los cupones con filtros opcionales
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: any): Promise<{
    coupons: CouponResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.couponsService.findAll(query);
  }

  /**
   * Obtener cupones activos (público)
   */
  @Get('active')
  async findActive(): Promise<CouponResponseDto[]> {
    return this.couponsService.findActive();
  }

  /**
   * Obtener cupones por categoría
   */
  @Get('category/:category')
  async findByCategory(@Param('category') category: string): Promise<CouponResponseDto[]> {
    return this.couponsService.findByCategory(category);
  }

  /**
   * Obtener cupones por tipo de descuento
   */
  @Get('type/:type')
  async findByType(@Param('type') type: string): Promise<CouponResponseDto[]> {
    return this.couponsService.findByType(type);
  }

  /**
   * Obtener un cupón por ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<CouponResponseDto> {
    return this.couponsService.findOne(id);
  }

  /**
   * Obtener un cupón por código (público)
   */
  @Get('code/:code')
  async findByCode(@Param('code') code: string): Promise<CouponResponseDto> {
    return this.couponsService.findByCode(code);
  }

  /**
   * Validar un cupón (público)
   */
  @Post('validate')
  async validateCoupon(@Body() validateCouponDto: ValidateCouponDto): Promise<{
    isValid: boolean;
    coupon?: CouponResponseDto;
    message: string;
    discount?: number;
  }> {
    return this.couponsService.validateCoupon(validateCouponDto);
  }

  /**
   * Usar un cupón (marcar como usado)
   */
  @Post('use/:code')
  @UseGuards(JwtAuthGuard)
  async useCoupon(@Param('code') code: string): Promise<CouponResponseDto> {
    return this.couponsService.useCoupon(code);
  }

  /**
   * Generar QR code para un cupón
   */
  @Get(':id/qr')
  @UseGuards(JwtAuthGuard)
  async generateQR(@Param('id') id: string): Promise<{ qrCode: string }> {
    return this.couponsService.generateQR(id);
  }

  /**
   * Actualizar un cupón
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ): Promise<CouponResponseDto> {
    return this.couponsService.update(id, updateCouponDto);
  }

  /**
   * Eliminar un cupón
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.couponsService.remove(id);
  }
} 