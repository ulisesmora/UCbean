import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { CampaignsService } from './application/use-cases/campaigns.service';
import { CampaignScheduler } from './application/schedulers/campaign.scheduler';
import { CampaignsController } from './presentation/controllers/campaigns.controller';

@Module({
  imports: [PrismaModule, NotificationsModule, DiscountsModule, LoyaltyModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignScheduler],
  exports: [CampaignsService],
})
export class CampaignsModule {}
