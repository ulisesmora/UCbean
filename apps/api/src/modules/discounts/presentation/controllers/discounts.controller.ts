import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayloadVo } from '../../../auth/domain/value-objects/jwt-payload.vo';
import { PrismaService } from '../../../../prisma/prisma.service';
import { DiscountsService } from '../../application/use-cases/discounts.service';
import { CreateDiscountDto, PreviewDiscountDto } from '../dtos/discounts.dto';

@ApiTags('Discounts')
@ApiBearerAuth()
@Controller('discounts')
@UseGuards(JwtAuthGuard)
export class DiscountsController {
  constructor(
    private readonly discounts: DiscountsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('mine')
  @ApiOperation({ summary: 'Codes I can use right now' })
  mine(@CurrentUser() user: JwtPayloadVo) {
    return this.discounts.availableFor(user.sub);
  }

  @Post('preview')
  @ApiOperation({ summary: 'How much this code would take off, without using it' })
  preview(@CurrentUser() user: JwtPayloadVo, @Body() dto: PreviewDiscountDto) {
    return this.discounts.preview(dto.code, user.sub, dto.orderTotal);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @ApiOperation({ summary: 'Create a code for everyone (OWNER only)' })
  create(@Body() dto: CreateDiscountDto) {
    return this.prisma.discount.create({
      data: {
        ...dto,
        code: dto.code.trim().toUpperCase(),
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
    });
  }
}
