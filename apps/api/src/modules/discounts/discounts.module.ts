import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DiscountsService } from './application/use-cases/discounts.service';
import { DiscountsListener } from './application/listeners/discounts.listener';
import { DiscountsController } from './presentation/controllers/discounts.controller';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [DiscountsController],
  providers: [DiscountsService, DiscountsListener],
  exports: [DiscountsService],
})
export class DiscountsModule {}
