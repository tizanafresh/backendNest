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
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, UpdateNotificationDto, NotificationResponseDto, DeviceTokenDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Crear una nueva notificación
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createNotification(@Body() createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  /**
   * Obtener todas las notificaciones con paginación
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllNotifications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('read') read?: string,
  ): Promise<{
    notifications: NotificationResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.notificationsService.getAllNotifications(page, limit, read);
  }

  /**
   * Obtener notificaciones del usuario actual
   */
  @Get('my-notifications')
  @UseGuards(JwtAuthGuard)
  async getMyNotifications(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('read') read?: string,
  ): Promise<{
    notifications: NotificationResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.notificationsService.getUserNotifications(user.userId, page, limit, read);
  }

  /**
   * Obtener notificaciones no leídas del usuario
   */
  @Get('unread')
  @UseGuards(JwtAuthGuard)
  async getUnreadNotifications(@CurrentUser() user: any): Promise<NotificationResponseDto[]> {
    return this.notificationsService.getUnreadNotifications(user.userId);
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getNotificationStats(@CurrentUser() user: any): Promise<{
    total: number;
    read: number;
    unread: number;
  }> {
    return this.notificationsService.getNotificationStats(user.userId);
  }

  /**
   * Registrar token de dispositivo
   */
  @Post('device-token')
  @UseGuards(JwtAuthGuard)
  async registerDeviceToken(
    @CurrentUser() user: any,
    @Body() deviceTokenDto: DeviceTokenDto,
  ): Promise<{ message: string }> {
    return this.notificationsService.registerDeviceToken(user.userId, deviceTokenDto);
  }

  /**
   * Eliminar token de dispositivo
   */
  @Delete('device-token/:token')
  @UseGuards(JwtAuthGuard)
  async removeDeviceToken(
    @CurrentUser() user: any,
    @Param('token') token: string,
  ): Promise<{ message: string }> {
    return this.notificationsService.removeDeviceToken(user.userId, token);
  }

  /**
   * Obtener una notificación por ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findNotificationById(@Param('id') id: string): Promise<NotificationResponseDto> {
    return this.notificationsService.findNotificationById(id);
  }

  /**
   * Actualizar una notificación
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateNotification(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.updateNotification(id, updateNotificationDto);
  }

  /**
   * Marcar notificación como leída
   */
  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Param('id') id: string): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(id);
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@CurrentUser() user: any): Promise<{ message: string }> {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  /**
   * Eliminar una notificación
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteNotification(@Param('id') id: string): Promise<{ message: string }> {
    return this.notificationsService.deleteNotification(id);
  }

  /**
   * Enviar notificación push
   */
  @Post('send-push')
  @UseGuards(JwtAuthGuard)
  async sendPushNotification(
    @Body() body: { userId: string; title: string; body: string; data?: any },
  ): Promise<{ message: string }> {
    return this.notificationsService.sendPushNotification(body.userId, body.title, body.body, body.data);
  }

  /**
   * Enviar notificación push masiva
   */
  @Post('send-push-massive')
  @UseGuards(JwtAuthGuard)
  async sendMassivePushNotification(
    @Body() body: { title: string; body: string; data?: any },
  ): Promise<{ message: string }> {
    return this.notificationsService.sendMassivePushNotification(body.title, body.body, body.data);
  }
} 