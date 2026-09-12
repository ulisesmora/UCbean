import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { OrdersModule } from './modules/orders/orders.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    EventEmitterModule.forRoot(),
    // Campañas programadas y felicitaciones de cumpleaños.
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
    ProductsModule,
    ReservationsModule,
    OrdersModule,
    NotificationsModule,
    LoyaltyModule,
    DiscountsModule,
    RecipesModule,
    CampaignsModule,
  ],
})
export class AppModule {}
