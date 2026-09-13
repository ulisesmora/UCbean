import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FavoritesController } from './favorites.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FavoritesController],
})
export class FavoritesModule {}
