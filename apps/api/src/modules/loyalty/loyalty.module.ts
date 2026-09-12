import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LoyaltyService } from './application/use-cases/loyalty.service';
import { LoyaltyListener } from './application/listeners/loyalty.listener';
import { LoyaltyController } from './presentation/controllers/loyalty.controller';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [LoyaltyController],
  providers: [LoyaltyService, LoyaltyListener],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
