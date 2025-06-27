import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema';
import { DeviceToken, DeviceTokenDocument } from '../schemas/device-token.schema';
import { CreateNotificationDto, UpdateNotificationDto, DeviceTokenDto, NotificationResponseDto } from './dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(DeviceToken.name) private deviceTokenModel: Model<DeviceTokenDocument>,
  ) {}

  async createNotification(createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    if (!Types.ObjectId.isValid(createNotificationDto.userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const notification = new this.notificationModel({
      ...createNotificationDto,
      userId: new Types.ObjectId(createNotificationDto.userId),
    });

    const savedNotification = await notification.save();
    return this.transformToNotificationResponse(savedNotification);
  }

  async getAllNotifications(page: number = 1, limit: number = 10, read?: string): Promise<{
    notifications: NotificationResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    if (read !== undefined) {
      filter.read = read === 'true';
    }

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);

    return {
      notifications: notifications.map(notification => this.transformToNotificationResponse(notification)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 10, read?: string): Promise<{
    notifications: NotificationResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const skip = (page - 1) * limit;

    const filter: any = { userId: new Types.ObjectId(userId) };
    
    if (read !== undefined) {
      filter.read = read === 'true';
    }

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);

    return {
      notifications: notifications.map(notification => this.transformToNotificationResponse(notification)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadNotifications(userId: string): Promise<NotificationResponseDto[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const notifications = await this.notificationModel
      .find({ 
        userId: new Types.ObjectId(userId),
        read: false 
      })
      .sort({ createdAt: -1 })
      .exec();

    return notifications.map(notification => this.transformToNotificationResponse(notification));
  }

  async getNotificationStats(userId: string): Promise<{
    total: number;
    read: number;
    unread: number;
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const [total, unread] = await Promise.all([
      this.notificationModel.countDocuments({ userId: new Types.ObjectId(userId) }).exec(),
      this.notificationModel.countDocuments({ 
        userId: new Types.ObjectId(userId),
        read: false 
      }).exec(),
    ]);

    return {
      total,
      read: total - unread,
      unread,
    };
  }

  async registerDeviceToken(userId: string, deviceTokenDto: DeviceTokenDto): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    // Verificar si el token ya existe para este usuario y plataforma
    const existingToken = await this.deviceTokenModel.findOne({
      userId: new Types.ObjectId(userId),
      token: deviceTokenDto.token,
      platform: deviceTokenDto.platform,
    });

    if (existingToken) {
      // Actualizar si ya existe
      existingToken.active = deviceTokenDto.active ?? true;
      await existingToken.save();
    } else {
      const deviceToken = new this.deviceTokenModel({
        ...deviceTokenDto,
        userId: new Types.ObjectId(userId),
      });
      await deviceToken.save();
    }

    return { message: 'Token de dispositivo registrado exitosamente' };
  }

  async removeDeviceToken(userId: string, token: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const result = await this.deviceTokenModel.findOneAndDelete({
      userId: new Types.ObjectId(userId),
      token,
    });

    if (!result) {
      throw new NotFoundException('Token de dispositivo no encontrado');
    }

    return { message: 'Token de dispositivo eliminado exitosamente' };
  }

  async findNotificationById(id: string): Promise<NotificationResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de notificación inválido');
    }

    const notification = await this.notificationModel.findById(id).exec();
    
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return this.transformToNotificationResponse(notification);
  }

  async updateNotification(id: string, updateNotificationDto: UpdateNotificationDto): Promise<NotificationResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de notificación inválido');
    }

    const notification = await this.notificationModel
      .findByIdAndUpdate(id, updateNotificationDto, { new: true })
      .exec();
    
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return this.transformToNotificationResponse(notification);
  }

  async markAsRead(id: string): Promise<NotificationResponseDto> {
    return this.updateNotification(id, { read: true });
  }

  async markAllAsRead(userId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true }
    );

    return { message: 'Todas las notificaciones marcadas como leídas' };
  }

  async deleteNotification(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de notificación inválido');
    }

    const result = await this.notificationModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return { message: 'Notificación eliminada exitosamente' };
  }

  async sendPushNotification(userId: string, title: string, message: string, data?: any): Promise<{ message: string }> {
    try {
      // Obtener tokens del usuario
      const deviceTokens = await this.getDeviceTokens(userId);
      
      if (deviceTokens.length === 0) {
        return { message: 'No se encontraron tokens de dispositivo para el usuario' };
      }

      // Aquí iría la lógica de envío real a Firebase/OneSignal
      // Por ahora es un placeholder
      console.log(`Enviando notificación push a ${deviceTokens.length} dispositivos:`, {
        title,
        message,
        data,
        tokens: deviceTokens.map(t => t.token)
      });

      return { message: `Notificación enviada a ${deviceTokens.length} dispositivos` };
    } catch (error) {
      throw new BadRequestException('Error al enviar notificación push');
    }
  }

  async sendMassivePushNotification(title: string, message: string, data?: any): Promise<{ message: string }> {
    try {
      // Obtener todos los tokens activos
      const deviceTokens = await this.deviceTokenModel
        .find({ active: true })
        .exec();
      
      if (deviceTokens.length === 0) {
        return { message: 'No se encontraron tokens de dispositivo activos' };
      }

      // Aquí iría la lógica de envío masivo real a Firebase/OneSignal
      // Por ahora es un placeholder
      console.log(`Enviando notificación masiva a ${deviceTokens.length} dispositivos:`, {
        title,
        message,
        data,
        tokens: deviceTokens.map(t => t.token)
      });

      return { message: `Notificación masiva enviada a ${deviceTokens.length} dispositivos` };
    } catch (error) {
      throw new BadRequestException('Error al enviar notificación masiva');
    }
  }

  // Métodos auxiliares
  async getDeviceTokens(userId: string): Promise<DeviceToken[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    return this.deviceTokenModel
      .find({ 
        userId: new Types.ObjectId(userId),
        active: true 
      })
      .exec();
  }

  async sendOrderStatusNotification(userId: string, orderId: string, status: string): Promise<void> {
    const statusMessages = {
      'PENDING': 'Tu pedido está pendiente de confirmación',
      'CONFIRMED': '¡Tu pedido ha sido confirmado!',
      'PREPARING': 'Tu pedido está siendo preparado',
      'READY': '¡Tu pedido está listo para recoger!',
      'DELIVERED': 'Tu pedido ha sido entregado',
      'CANCELLED': 'Tu pedido ha sido cancelado',
    };

    const message = statusMessages[status] || `Tu pedido ha cambiado a estado: ${status}`;

    await this.createNotification({
      userId,
      title: 'Actualización de Pedido',
      message,
      type: 'ORDER_STATUS' as any,
      data: { orderId, status },
    });

    // Enviar notificación push
    await this.sendPushNotification(userId, 'Actualización de Pedido', message, { orderId, status });
  }

  private transformToNotificationResponse(notification: NotificationDocument): NotificationResponseDto {
    const notificationObject = notification.toObject();
    return {
      _id: notificationObject._id?.toString() || '',
      userId: notificationObject.userId?.toString() || '',
      title: notificationObject.title || '',
      message: notificationObject.message || '',
      type: notificationObject.type || 'SYSTEM',
      read: notificationObject.read || false,
      data: notificationObject.data,
      createdAt: notificationObject.createdAt,
      updatedAt: notificationObject.updatedAt,
    };
  }
} 