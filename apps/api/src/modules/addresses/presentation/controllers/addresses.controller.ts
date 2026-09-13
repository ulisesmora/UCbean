import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayloadVo } from '../../../auth/domain/value-objects/jwt-payload.vo';
import { AddressesService } from '../../application/use-cases/addresses.service';
import { CreateAddressDto, UpdateAddressDto } from '../dtos/addresses.dto';

@ApiTags('Addresses')
@ApiBearerAuth()
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Mis direcciones, la principal primero' })
  mine(@CurrentUser() user: JwtPayloadVo) {
    return this.addresses.listFor(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Save an address' })
  create(@CurrentUser() user: JwtPayloadVo, @Body() dto: CreateAddressDto) {
    return this.addresses.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit one of my addresses' })
  update(
    @CurrentUser() user: JwtPayloadVo,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addresses.update(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address with no orders' })
  remove(@CurrentUser() user: JwtPayloadVo, @Param('id') id: string) {
    return this.addresses.remove(id, user.sub);
  }
}
