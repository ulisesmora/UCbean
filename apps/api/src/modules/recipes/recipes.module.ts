import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RecipesService } from './application/use-cases/recipes.service';
import { RecipesController } from './presentation/controllers/recipes.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
