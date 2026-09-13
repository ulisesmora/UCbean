import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CafeController } from './cafe.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CafeController],
})
export class CafeModule {}
