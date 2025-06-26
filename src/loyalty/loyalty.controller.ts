import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoyaltyService } from './loyalty.service';
import { CreateLoyaltyDto, LoyaltyResponseDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  /**
   * Crear un registro de fidelización (admin o sistema)
   */
  @Post()
  async createLoyaltyRecord(@Body() createLoyaltyDto: CreateLoyaltyDto): Promise<LoyaltyResponseDto> {
    return this.loyaltyService.createLoyaltyRecord(createLoyaltyDto);
  }

  /**
   * Obtener historial de fidelización del usuario autenticado
   */
  @Get('my-history')
  async getMyLoyaltyHistory(
    @Request() req: RequestWithUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.loyaltyService.getUserLoyaltyHistory(req.user.sub, page, limit);
  }

  /**
   * Obtener estadísticas de fidelización del usuario autenticado
   */
  @Get('my-stats')
  async getMyLoyaltyStats(@Request() req: RequestWithUser) {
    return this.loyaltyService.getUserLoyaltyStats(req.user.sub);
  }

  /**
   * Obtener historial de fidelización de cualquier usuario (admin)
   */
  @Get('user/:userId')
  async getUserLoyaltyHistory(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.loyaltyService.getUserLoyaltyHistory(userId, page, limit);
  }

  /**
   * Obtener estadísticas de fidelización de cualquier usuario (admin)
   */
  @Get('user/:userId/stats')
  async getUserLoyaltyStats(@Param('userId') userId: string) {
    return this.loyaltyService.getUserLoyaltyStats(userId);
  }

  /**
   * Obtener todos los registros de fidelización (admin)
   */
  @Get()
  async getAllLoyaltyRecords(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.loyaltyService.getAllLoyaltyRecords(page, limit);
  }

  /**
   * Obtener beneficios disponibles por nivel
   */
  @Get('benefits/levels')
  async getLevelBenefits() {
    return this.loyaltyService.getLevelBenefits();
  }

  /**
   * Obtener beneficios disponibles para el usuario actual
   */
  @Get('benefits/user')
  @UseGuards(JwtAuthGuard)
  async getUserBenefits(@CurrentUser() user: any) {
    return this.loyaltyService.getUserBenefits(user.userId);
  }

  /**
   * Aplicar descuento por nivel de fidelización
   */
  @Post('benefits/apply-discount')
  @UseGuards(JwtAuthGuard)
  async applyLevelDiscount(
    @CurrentUser() user: any,
    @Body() body: { orderTotal: number }
  ) {
    return this.loyaltyService.applyLevelDiscount(user.userId, body.orderTotal);
  }

  /**
   * Validar código de beneficio
   */
  @Post('benefits/validate-code')
  @UseGuards(JwtAuthGuard)
  async validateBenefitCode(
    @CurrentUser() user: any,
    @Body() body: { code: string }
  ) {
    return this.loyaltyService.validateBenefitCode(user.userId, body.code);
  }
} 