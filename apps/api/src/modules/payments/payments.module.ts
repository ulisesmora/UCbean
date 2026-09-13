import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StripeClient } from './infrastructure/stripe.client';
import { PaymentsService } from './application/use-cases/payments.service';
import { PaymentsController } from './presentation/controllers/payments.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [StripeClient, PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
