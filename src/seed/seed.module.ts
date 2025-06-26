import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';

// Importar todos los esquemas
import { User, UserSchema } from '../schemas/user.schema';
import { Category, CategorySchema } from '../schemas/category.schema';
import { Product, ProductSchema } from '../schemas/product.schema';
import { Coupon, CouponSchema } from '../schemas/coupon.schema';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Notification, NotificationSchema } from '../schemas/notification.schema';
import { LoyaltyHistory, LoyaltyHistorySchema } from '../schemas/loyalty-history.schema';
import { DeviceToken, DeviceTokenSchema } from '../schemas/device-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: LoyaltyHistory.name, schema: LoyaltyHistorySchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
    ]),
  ],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {} 