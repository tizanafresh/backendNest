import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyHistory, LoyaltyHistorySchema } from '../schemas/loyalty-history.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Order, OrderSchema } from '../schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoyaltyHistory.name, schema: LoyaltyHistorySchema },
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema }
    ])
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService]
})
export class LoyaltyModule {} 