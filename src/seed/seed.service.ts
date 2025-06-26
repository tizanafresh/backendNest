import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

// Importar todos los modelos
import { User, UserDocument } from '../schemas/user.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Coupon, CouponDocument } from '../schemas/coupon.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Notification, NotificationDocument } from '../schemas/notification.schema';
import { LoyaltyHistory, LoyaltyHistoryDocument } from '../schemas/loyalty-history.schema';
import { DeviceToken, DeviceTokenDocument } from '../schemas/device-token.schema';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(LoyaltyHistory.name) private loyaltyHistoryModel: Model<LoyaltyHistoryDocument>,
    @InjectModel(DeviceToken.name) private deviceTokenModel: Model<DeviceTokenDocument>,
  ) {}

  async seedAll() {
    this.logger.log('🌱 Iniciando proceso de seeding...');
    
    try {
      // Limpiar todas las colecciones
      await this.clearAllCollections();
      
      // Crear datos en orden de dependencias
      const categories = await this.seedCategories();
      const users = await this.seedUsers();
      const products = await this.seedProducts(categories);
      const coupons = await this.seedCoupons(users);
      const orders = await this.seedOrders(users, products, coupons);
      const notifications = await this.seedNotifications(users);
      const loyaltyHistory = await this.seedLoyaltyHistory(users, orders);
      const deviceTokens = await this.seedDeviceTokens(users);

      this.logger.log('✅ Seeding completado exitosamente!');
      
      return {
        message: 'Base de datos poblada exitosamente',
        summary: {
          categories: categories.length,
          users: users.length,
          products: products.length,
          coupons: coupons.length,
          orders: orders.length,
          notifications: notifications.length,
          loyaltyHistory: loyaltyHistory.length,
          deviceTokens: deviceTokens.length,
        }
      };
    } catch (error) {
      this.logger.error('❌ Error durante el seeding:', error);
      throw error;
    }
  }

  private async clearAllCollections() {
    this.logger.log('🧹 Limpiando colecciones existentes...');
    
    await Promise.all([
      this.userModel.deleteMany({}),
      this.categoryModel.deleteMany({}),
      this.productModel.deleteMany({}),
      this.couponModel.deleteMany({}),
      this.orderModel.deleteMany({}),
      this.notificationModel.deleteMany({}),
      this.loyaltyHistoryModel.deleteMany({}),
      this.deviceTokenModel.deleteMany({}),
    ]);
  }

  private async seedCategories(): Promise<CategoryDocument[]> {
    this.logger.log('📂 Creando categorías...');
    
    const categoriesData = [
      {
        name: 'Tizanas Clásicas',
        description: 'Nuestras tizanas más populares y tradicionales',
        image: 'https://example.com/classic-tizanas.jpg',
      },
      {
        name: 'Tizanas Especiales',
        description: 'Tizanas con ingredientes únicos y sabores exóticos',
        image: 'https://example.com/special-tizanas.jpg',
      },
      {
        name: 'Tizanas Saludables',
        description: 'Tizanas bajas en calorías y ricas en nutrientes',
        image: 'https://example.com/healthy-tizanas.jpg',
      },
      {
        name: 'Tizanas de Temporada',
        description: 'Tizanas que cambian según la estación del año',
        image: 'https://example.com/seasonal-tizanas.jpg',
      },
      {
        name: 'Bebidas Complementarias',
        description: 'Jugos, smoothies y otras bebidas',
        image: 'https://example.com/complementary-drinks.jpg',
      },
    ];

    const categories = await this.categoryModel.insertMany(categoriesData);
    this.logger.log(`✅ ${categories.length} categorías creadas`);
    return categories;
  }

  private async seedUsers(): Promise<UserDocument[]> {
    this.logger.log('👥 Creando usuarios...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const usersData = [
      {
        name: 'Admin Tizanas',
        email: 'admin@tizanafresh.com',
        password: hashedPassword,
        phone: '+1234567890',
        points: 1000,
        level: 'PLATINUM',
        qrCode: 'QR_ADMIN_001',
      },
      {
        name: 'María González',
        email: 'maria@example.com',
        password: hashedPassword,
        phone: '+1234567891',
        points: 750,
        level: 'GOLD',
        qrCode: 'QR_USER_001',
      },
      {
        name: 'Carlos Rodríguez',
        email: 'carlos@example.com',
        password: hashedPassword,
        phone: '+1234567892',
        points: 500,
        level: 'SILVER',
        qrCode: 'QR_USER_002',
      },
      {
        name: 'Ana Martínez',
        email: 'ana@example.com',
        password: hashedPassword,
        phone: '+1234567893',
        points: 250,
        level: 'BRONZE',
        qrCode: 'QR_USER_003',
      },
      {
        name: 'Luis Pérez',
        email: 'luis@example.com',
        password: hashedPassword,
        phone: '+1234567894',
        points: 100,
        level: 'BRONZE',
        qrCode: 'QR_USER_004',
      },
    ];

    const users = await this.userModel.insertMany(usersData);
    this.logger.log(`✅ ${users.length} usuarios creados`);
    return users;
  }

  private async seedProducts(categories: CategoryDocument[]): Promise<ProductDocument[]> {
    this.logger.log('🥤 Creando productos...');
    
    const productsData = [
      {
        name: 'Tizana de Frutos Rojos',
        description: 'Refrescante mezcla de fresas, frambuesas y moras con hierbas naturales',
        price: 8.50,
        category: categories[0]._id, // Frutas
        image: 'https://example.com/tizana-frutos-rojos.jpg',
        ingredients: ['fresas', 'frambuesas', 'moras', 'hierbabuena', 'limón'],
        nutritionalInfo: {
          calories: 45,
          protein: 1.2,
          carbs: 10.5,
          fat: 0.3,
          fiber: 3.2,
        },
      },
      {
        name: 'Tizana Tropical',
        description: 'Exótica combinación de piña, mango y coco con jengibre fresco',
        price: 9.00,
        category: categories[0]._id, // Frutas
        image: 'https://example.com/tizana-tropical.jpg',
        ingredients: ['piña', 'mango', 'coco', 'jengibre', 'lima'],
        nutritionalInfo: {
          calories: 52,
          protein: 0.8,
          carbs: 12.1,
          fat: 0.5,
          fiber: 2.8,
        },
      },
      {
        name: 'Tizana Detox Verde',
        description: 'Potente detox con espinaca, pepino y manzana verde',
        price: 7.50,
        category: categories[1]._id, // Detox
        image: 'https://example.com/tizana-detox-verde.jpg',
        ingredients: ['espinaca', 'pepino', 'manzana verde', 'limón', 'jengibre'],
        nutritionalInfo: {
          calories: 38,
          protein: 2.1,
          carbs: 8.3,
          fat: 0.2,
          fiber: 4.1,
        },
      },
      {
        name: 'Tizana Energética',
        description: 'Energizante natural con guaraná, ginseng y frutas cítricas',
        price: 10.00,
        category: categories[2]._id, // Energética
        image: 'https://example.com/tizana-energetica.jpg',
        ingredients: ['guaraná', 'ginseng', 'naranja', 'limón', 'miel'],
        nutritionalInfo: {
          calories: 65,
          protein: 0.5,
          carbs: 15.2,
          fat: 0.1,
          fiber: 1.8,
        },
      },
      {
        name: 'Tizana Relajante',
        description: 'Calmante mezcla de manzanilla, lavanda y miel',
        price: 6.50,
        category: categories[3]._id, // Relajante
        image: 'https://example.com/tizana-relajante.jpg',
        ingredients: ['manzanilla', 'lavanda', 'miel', 'limón', 'canela'],
        nutritionalInfo: {
          calories: 42,
          protein: 0.3,
          carbs: 9.8,
          fat: 0.1,
          fiber: 0.5,
        },
      },
    ];

    const products = await this.productModel.insertMany(productsData);
    this.logger.log(`✅ ${products.length} productos creados`);
    return products as ProductDocument[];
  }

  private async seedCoupons(users: UserDocument[]): Promise<CouponDocument[]> {
    this.logger.log('🎫 Creando cupones...');
    
    const couponsData = [
      {
        code: 'WELCOME10',
        qrCode: 'QR_COUPON_001',
        discount: 10,
        type: 'PERCENTAGE',
        minAmount: 20,
        maxUses: 100,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        active: true,
      },
      {
        code: 'FREESHIP',
        qrCode: 'QR_COUPON_002',
        discount: 5,
        type: 'FIXED',
        minAmount: 30,
        maxUses: 50,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 días
        active: true,
      },
      {
        code: 'LOYALTY20',
        qrCode: 'QR_COUPON_003',
        discount: 20,
        type: 'PERCENTAGE',
        minAmount: 50,
        maxUses: 25,
        usedCount: 0,
        userId: users[1]._id, // Cupón personalizado para María
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        active: true,
      },
    ];

    const coupons = await this.couponModel.insertMany(couponsData);
    this.logger.log(`✅ ${coupons.length} cupones creados`);
    return coupons as CouponDocument[];
  }

  private async seedOrders(users: UserDocument[], products: ProductDocument[], coupons: CouponDocument[]): Promise<OrderDocument[]> {
    this.logger.log('📦 Creando pedidos...');
    
    const ordersData = [
      {
        userId: users[1]._id, // María
        items: [
          {
            productId: products[0]._id,
            name: products[0].name,
            quantity: 2,
            price: products[0].price,
            notes: 'Sin hielo',
          },
          {
            productId: products[2]._id,
            name: products[2].name,
            quantity: 1,
            price: products[2].price,
            notes: 'Extra jengibre',
          },
        ],
        total: 24.50,
        discount: 2.45,
        finalTotal: 22.05,
        status: 'DELIVERED',
        couponId: coupons[0]._id,
        deliveryAddress: {
          street: 'Calle Principal 123',
          city: 'Ciudad de México',
          zipCode: '12345',
          instructions: 'Entregar en la puerta principal',
        },
      },
      {
        userId: users[2]._id, // Carlos
        items: [
          {
            productId: products[1]._id,
            name: products[1].name,
            quantity: 1,
            price: products[1].price,
            notes: '',
          },
        ],
        total: 9.00,
        discount: 0,
        finalTotal: 9.00,
        status: 'PREPARING',
        deliveryAddress: {
          street: 'Avenida Central 456',
          city: 'Guadalajara',
          zipCode: '54321',
          instructions: '',
        },
      },
    ];

    const orders = await this.orderModel.insertMany(ordersData);
    this.logger.log(`✅ ${orders.length} pedidos creados`);
    return orders as OrderDocument[];
  }

  private async seedNotifications(users: UserDocument[]): Promise<NotificationDocument[]> {
    this.logger.log('🔔 Creando notificaciones...');
    
    const notificationsData = [
      {
        userId: users[1]._id,
        title: '¡Tu pedido está listo!',
        message: 'Tu Tizana de Frutos Rojos y Tizana Detox Verde están listas para recoger.',
        type: 'ORDER',
        read: false,
      },
      {
        userId: users[1]._id,
        title: '¡Nuevo cupón disponible!',
        message: 'Usa el código LOYALTY20 y obtén 20% de descuento en tu próxima compra.',
        type: 'PROMOTION',
        read: false,
      },
      {
        userId: users[2]._id,
        title: 'Tu pedido está en preparación',
        message: 'Estamos preparando tu Tizana Tropical con mucho cuidado.',
        type: 'ORDER',
        read: true,
      },
      {
        userId: users[0]._id, // Admin
        title: 'Bienvenido a Tizanas Fresh',
        message: 'Gracias por unirte a nuestra comunidad de amantes de las tizanas.',
        type: 'SYSTEM',
        read: true,
      },
    ];

    const notifications = await this.notificationModel.insertMany(notificationsData);
    this.logger.log(`✅ ${notifications.length} notificaciones creadas`);
    return notifications as NotificationDocument[];
  }

  private async seedLoyaltyHistory(users: UserDocument[], orders: OrderDocument[]): Promise<LoyaltyHistoryDocument[]> {
    this.logger.log('🏆 Creando historial de fidelización...');
    
    const loyaltyHistoryData = [
      {
        userId: users[1]._id,
        type: 'EARNED',
        points: 50,
        description: 'Compra realizada - Tizana de Frutos Rojos x2, Tizana Detox Verde x1',
        orderId: orders[0]._id,
      },
      {
        userId: users[1]._id,
        type: 'BONUS',
        points: 25,
        description: 'Bono por primera compra',
        orderId: orders[0]._id,
      },
      {
        userId: users[2]._id,
        type: 'EARNED',
        points: 30,
        description: 'Compra realizada - Tizana Tropical x1',
        orderId: orders[1]._id,
      },
      {
        userId: users[0]._id,
        type: 'PROMOTION',
        points: 100,
        description: 'Puntos de bienvenida para administrador',
      },
    ];

    const loyaltyHistory = await this.loyaltyHistoryModel.insertMany(loyaltyHistoryData);
    this.logger.log(`✅ ${loyaltyHistory.length} registros de fidelización creados`);
    return loyaltyHistory as LoyaltyHistoryDocument[];
  }

  private async seedDeviceTokens(users: UserDocument[]): Promise<DeviceTokenDocument[]> {
    this.logger.log('📱 Creando tokens de dispositivos...');
    
    const deviceTokensData = [
      {
        userId: users[1]._id,
        token: 'fcm_token_maria_001',
        platform: 'ANDROID',
        active: true,
      },
      {
        userId: users[2]._id,
        token: 'fcm_token_carlos_001',
        platform: 'IOS',
        active: true,
      },
      {
        userId: users[3]._id,
        token: 'fcm_token_ana_001',
        platform: 'ANDROID',
        active: true,
      },
    ];

    const deviceTokens = await this.deviceTokenModel.insertMany(deviceTokensData);
    this.logger.log(`✅ ${deviceTokens.length} tokens de dispositivos creados`);
    return deviceTokens as DeviceTokenDocument[];
  }
} 