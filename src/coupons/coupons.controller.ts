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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto, CouponResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Cupones')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo cupón' })
  @ApiResponse({ 
    status: 201, 
    description: 'Cupón creado exitosamente',
    type: CouponResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Código de cupón ya existe' })
  async create(@Body() createCouponDto: CreateCouponDto): Promise<CouponResponseDto> {
    return this.couponsService.create(createCouponDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los cupones' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados por página' })
  @ApiQuery({ name: 'active', required: false, description: 'Filtrar por estado activo' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrar por tipo de descuento' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de cupones',
    type: [CouponResponseDto] 
  })
  async findAll(@Query() query: any): Promise<CouponResponseDto[]> {
    return this.couponsService.findAll(query);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estadísticas de cupones' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas de cupones',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        active: { type: 'number' },
        expired: { type: 'number' },
        totalUses: { type: 'number' }
      }
    }
  })
  async getStats() {
    return this.couponsService.getCouponStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cupón por ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cupón encontrado',
    type: CouponResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Cupón no encontrado' })
  async findOne(@Param('id') id: string): Promise<CouponResponseDto> {
    return this.couponsService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Obtener un cupón por código' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cupón encontrado',
    type: CouponResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Cupón no encontrado' })
  async findByCode(@Param('code') code: string): Promise<CouponResponseDto> {
    return this.couponsService.findByCode(code);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar un cupón' })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado de validación',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        coupon: { type: 'object' },
        discount: { type: 'number' },
        message: { type: 'string' }
      }
    }
  })
  async validateCoupon(@Body() validateCouponDto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(validateCouponDto);
  }

  @Post(':code/use')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usar un cupón (incrementar contador de usos)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cupón usado exitosamente',
    type: CouponResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Cupón no encontrado' })
  async useCoupon(@Param('code') code: string): Promise<CouponResponseDto> {
    return this.couponsService.useCoupon(code);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un cupón' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cupón actualizado exitosamente',
    type: CouponResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Cupón no encontrado' })
  @ApiResponse({ status: 409, description: 'Código de cupón ya existe' })
  async update(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ): Promise<CouponResponseDto> {
    return this.couponsService.update(id, updateCouponDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un cupón' })
  @ApiResponse({ status: 200, description: 'Cupón eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Cupón no encontrado' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.couponsService.remove(id);
  }
} 