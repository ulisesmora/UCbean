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
import { AddressesModule } from './modules/addresses/addresses.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CrmModule } from './modules/crm/crm.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { CafeModule } from './modules/cafe/cafe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Development reads .env, which is also what the Prisma CLI and the
      // seeds read. Production reads only .env.production, never falling back
      // to .env, so a local database URL can never fill a missing production
      // key. Variables already set (Railway) always win over either file.
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
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
    AddressesModule,
    PaymentsModule,
    CrmModule,
    UploadsModule,
    FavoritesModule,
    CafeModule,
  ],
})
export class AppModule {}
