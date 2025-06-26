import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderResponseDto,
  QueryOrderDto,
  OrderStatus,
} from './dto';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  /**
   * Crear un nuevo pedido
   */
  @Post()
  async createOrder(
    @Request() req: RequestWithUser,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.createOrder(req.user.sub, createOrderDto);
  }

  /**
   * Obtener todos los pedidos (admin)
   */
  @Get()
  async getAllOrders(@Query() queryDto: QueryOrderDto): Promise<{
    orders: OrderResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.ordersService.findAllOrders(queryDto);
  }

  /**
   * Obtener pedidos del usuario autenticado
   */
  @Get('my-orders')
  async getMyOrders(
    @Request() req: RequestWithUser,
    @Query() queryDto: QueryOrderDto,
  ): Promise<{
    orders: OrderResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.ordersService.findOrdersByUserId(req.user.sub, queryDto);
  }

  /**
   * Obtener pedido por ID
   */
  @Get(':id')
  async getOrderById(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.findOrderById(id);
  }

  /**
   * Actualizar pedido (admin o propietario)
   */
  @Put(':id')
  async updateOrder(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req: RequestWithUser,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateOrder(id, updateOrderDto, req.user.sub);
  }

  /**
   * Eliminar pedido (solo propietario)
   */
  @Delete(':id')
  async deleteOrder(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    return this.ordersService.deleteOrder(id, req.user.sub);
  }

  /**
   * Obtener estadísticas de pedidos (admin)
   */
  @Get('stats/admin')
  async getAdminStats(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    preparing: number;
    ready: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
  }> {
    return this.ordersService.getOrderStats();
  }

  /**
   * Obtener estadísticas de pedidos del usuario
   */
  @Get('stats/my-orders')
  async getMyOrderStats(
    @Request() req: RequestWithUser,
  ): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    preparing: number;
    ready: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
  }> {
    return this.ordersService.getOrderStats(req.user.sub);
  }

  /**
   * Cambiar estado del pedido a CONFIRMED
   */
  @Put(':id/confirm')
  async confirmOrder(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.updateOrder(id, { status: OrderStatus.CONFIRMED });
  }

  /**
   * Cambiar estado del pedido a PREPARING
   */
  @Put(':id/preparing')
  async preparingOrder(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.updateOrder(id, { status: OrderStatus.PREPARING });
  }

  /**
   * Cambiar estado del pedido a READY
   */
  @Put(':id/ready')
  async readyOrder(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.updateOrder(id, { status: OrderStatus.READY });
  }

  /**
   * Cambiar estado del pedido a DELIVERED
   */
  @Put(':id/delivered')
  async deliveredOrder(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.updateOrder(id, { status: OrderStatus.DELIVERED });
  }

  /**
   * Cambiar estado del pedido a CANCELLED
   */
  @Put(':id/cancel')
  async cancelOrder(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.updateOrder(id, { status: OrderStatus.CANCELLED });
  }
} 