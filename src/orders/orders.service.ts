import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Coupon, CouponDocument } from '../schemas/coupon.schema';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderResponseDto,
  QueryOrderDto,
} from './dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    private loyaltyService: LoyaltyService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Crear un nuevo pedido
   */
  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    // Verificar que todos los productos existen
    const productIds = createOrderDto.items.map(item => item.productId);
    const products = await this.productModel.find({
      _id: { $in: productIds }
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Uno o más productos no existen');
    }

    // Calcular total
    let total = 0;
    for (const item of createOrderDto.items) {
      total += item.price * item.quantity;
    }

    // Aplicar cupón si existe
    let couponDiscount = 0;
    if (createOrderDto.couponId) {
      if (!Types.ObjectId.isValid(createOrderDto.couponId)) {
        throw new BadRequestException('ID de cupón inválido');
      }

      const coupon = await this.couponModel.findById(createOrderDto.couponId);
      if (!coupon) {
        throw new NotFoundException('Cupón no encontrado');
      }

      if (!coupon.active) {
        throw new BadRequestException('Cupón inactivo');
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw new BadRequestException('Cupón expirado');
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new BadRequestException('Cupón agotado');
      }

      if (coupon.minAmount && total < coupon.minAmount) {
        throw new BadRequestException(`Monto mínimo requerido: $${coupon.minAmount}`);
      }

      // Calcular descuento del cupón
      if (coupon.type === 'PERCENTAGE') {
        couponDiscount = (total * coupon.discount) / 100;
      } else {
        couponDiscount = coupon.discount;
      }

      // Incrementar contador de uso del cupón
      await this.couponModel.findByIdAndUpdate(
        createOrderDto.couponId,
        { $inc: { usedCount: 1 } }
      );
    }

    // Aplicar descuento por nivel de fidelización
    const loyaltyDiscount = await this.loyaltyService.applyLevelDiscount(userId, total - couponDiscount);
    
    const totalDiscount = couponDiscount + loyaltyDiscount.discount;
    const finalTotal = total - totalDiscount;

    // Crear el pedido
    const newOrder = new this.orderModel({
      userId: new Types.ObjectId(userId),
      items: createOrderDto.items,
      total,
      discount: totalDiscount,
      finalTotal,
      status: 'PENDING',
      couponId: createOrderDto.couponId ? new Types.ObjectId(createOrderDto.couponId) : undefined,
      deliveryAddress: createOrderDto.deliveryAddress,
    });

    const savedOrder = await newOrder.save();
    return this.transformToOrderResponse(savedOrder);
  }

  /**
   * Obtener todos los pedidos (con paginación y filtros)
   */
  async findAllOrders(queryDto: QueryOrderDto): Promise<{
    orders: OrderResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, status, userId, search, sortBy = 'createdAt', sortOrder = 'desc' } = queryDto;
    const skip = (page - 1) * limit;

    // Construir filtros
    const filters: any = {};
    if (status) filters.status = status;
    if (userId) filters.userId = new Types.ObjectId(userId);
    if (search) {
      filters.$or = [
        { 'items.name': { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
      ];
    }

    // Construir ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filters)
        .populate('userId', 'name email')
        .populate('couponId', 'code discount type')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filters).exec(),
    ]);

    return {
      orders: orders.map(order => this.transformToOrderResponse(order)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener pedido por ID
   */
  async findOrderById(id: string): Promise<OrderResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de pedido inválido');
    }

    const order = await this.orderModel
      .findById(id)
      .populate('userId', 'name email')
      .populate('couponId', 'code discount type');

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return this.transformToOrderResponse(order);
  }

  /**
   * Obtener pedidos de un usuario
   */
  async findOrdersByUserId(userId: string, queryDto: QueryOrderDto): Promise<{
    orders: OrderResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = queryDto;
    const skip = (page - 1) * limit;

    // Construir filtros
    const filters: any = { userId: new Types.ObjectId(userId) };
    if (status) filters.status = status;

    // Construir ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filters)
        .populate('couponId', 'code discount type')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filters).exec(),
    ]);

    return {
      orders: orders.map(order => this.transformToOrderResponse(order)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Actualizar pedido
   */
  async updateOrder(id: string, updateOrderDto: UpdateOrderDto, userId?: string): Promise<OrderResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de pedido inválido');
    }

    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Si se proporciona userId, verificar que el usuario sea el propietario del pedido
    if (userId && order.userId.toString() !== userId) {
      throw new ForbiddenException('No tienes permisos para actualizar este pedido');
    }

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true, runValidators: true })
      .populate('userId', 'name email')
      .populate('couponId', 'code discount type');

    if (!updatedOrder) {
      throw new NotFoundException('Error al actualizar el pedido');
    }

    // Verificar si el pedido cambió a estado DELIVERED para agregar puntos automáticos
    if (updateOrderDto.status === 'DELIVERED' && order.status !== 'DELIVERED') {
      try {
        await this.loyaltyService.addPointsForPurchase(
          updatedOrder.userId.toString(),
          id,
          updatedOrder.finalTotal
        );
      } catch (error) {
        // Log del error pero no fallar la actualización del pedido
        console.error('Error al agregar puntos automáticos:', error);
      }
    }

    // Enviar notificación automática si cambió el estado
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      try {
        await this.notificationsService.sendOrderStatusNotification(
          updatedOrder.userId.toString(),
          id,
          updateOrderDto.status
        );
      } catch (error) {
        // Log del error pero no fallar la actualización del pedido
        console.error('Error al enviar notificación de cambio de estado:', error);
      }
    }

    return this.transformToOrderResponse(updatedOrder);
  }

  /**
   * Eliminar pedido
   */
  async deleteOrder(id: string, userId?: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de pedido inválido');
    }

    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Si se proporciona userId, verificar que el usuario sea el propietario del pedido
    if (userId && order.userId.toString() !== userId) {
      throw new ForbiddenException('No tienes permisos para eliminar este pedido');
    }

    // Solo permitir eliminar pedidos pendientes
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Solo se pueden eliminar pedidos pendientes');
    }

    await this.orderModel.findByIdAndDelete(id);
    return { message: 'Pedido eliminado exitosamente' };
  }

  /**
   * Obtener estadísticas de pedidos
   */
  async getOrderStats(userId?: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    preparing: number;
    ready: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
  }> {
    const filters: any = {};
    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('ID de usuario inválido');
      }
      filters.userId = new Types.ObjectId(userId);
    }

    const stats = await this.orderModel.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalRevenue: { $sum: '$finalTotal' },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'CONFIRMED'] }, 1, 0] }
          },
          preparing: {
            $sum: { $cond: [{ $eq: ['$status', 'PREPARING'] }, 1, 0] }
          },
          ready: {
            $sum: { $cond: [{ $eq: ['$status', 'READY'] }, 1, 0] }
          },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] }
          },
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
    };

    return {
      total: result.total,
      pending: result.pending,
      confirmed: result.confirmed,
      preparing: result.preparing,
      ready: result.ready,
      delivered: result.delivered,
      cancelled: result.cancelled,
      totalRevenue: result.totalRevenue,
    };
  }

  /**
   * Transformar documento de pedido a DTO de respuesta
   */
  private transformToOrderResponse(order: OrderDocument): OrderResponseDto {
    const orderObject = order.toObject();
    return {
      _id: orderObject._id?.toString() || '',
      userId: orderObject.userId?.toString() || '',
      items: orderObject.items || [],
      total: orderObject.total || 0,
      discount: orderObject.discount || 0,
      finalTotal: orderObject.finalTotal || 0,
      status: orderObject.status || 'PENDING',
      couponId: orderObject.couponId?.toString() || undefined,
      deliveryAddress: orderObject.deliveryAddress || undefined,
      createdAt: orderObject.createdAt || undefined,
      updatedAt: orderObject.updatedAt || undefined,
    } as OrderResponseDto;
  }
} 