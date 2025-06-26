import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Product, ProductSchema } from '../schemas/product.schema';
import { Coupon, CouponSchema } from '../schemas/coupon.schema';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { LoyaltyHistory, LoyaltyHistorySchema } from '../schemas/loyalty-history.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: LoyaltyHistory.name, schema: LoyaltyHistorySchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, LoyaltyService],
  exports: [OrdersService],
})
export class OrdersModule {} 