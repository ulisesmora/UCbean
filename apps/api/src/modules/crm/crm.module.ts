import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CounterService } from './application/use-cases/counter.service';
import { CrmController } from './presentation/controllers/crm.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CrmController],
  providers: [CounterService],
})
export class CrmModule {}
