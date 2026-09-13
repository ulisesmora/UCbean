import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AddressesService } from './application/use-cases/addresses.service';
import { AddressesController } from './presentation/controllers/addresses.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AddressesController],
  providers: [AddressesService],
  // El pedido comprueba con esto que la dirección es de quien pide.
  exports: [AddressesService],
})
export class AddressesModule {}
