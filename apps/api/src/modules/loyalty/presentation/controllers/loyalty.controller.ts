import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayloadVo } from '../../../auth/domain/value-objects/jwt-payload.vo';
import { PrismaService } from '../../../../prisma/prisma.service';
import { LoyaltyService } from '../../application/use-cases/loyalty.service';
import { SendNotificationUseCase } from '../../../notifications/application/use-cases/send-notification.use-case';
import * as t from '../../../notifications/domain/templates';
import { CreateRewardDto, GrantPointsDto } from '../dtos/loyalty.dto';

@ApiTags('Loyalty')
@Controller('loyalty')
export class LoyaltyController {
  constructor(
    private readonly loyalty: LoyaltyService,
    private readonly prisma: PrismaService,
    private readonly notify: SendNotificationUseCase,
  ) {}

  @Get('rewards')
  @ApiOperation({ summary: 'What can be redeemed, and for how many points' })
  rewards() {
    return this.prisma.reward.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { cost: 'asc' }],
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'My balance, stamps and recent activity' })
  async me(@CurrentUser() user: JwtPayloadVo) {
    const card = await this.loyalty.cardFor(user.sub);
    const [points, movements, redemptions] = await Promise.all([
      this.loyalty.balanceOf(user.sub),
      this.loyalty.movements(user.sub),
      this.prisma.rewardRedemption.findMany({
        where: { cardId: card.id, status: 'PENDING' },
        include: { reward: true },
      }),
    ]);
    return { points, stamps: card.stamps, movements, pendingRedemptions: redemptions };
  }

  @Post('redeem/:rewardId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Redeem points for a reward' })
  async redeem(@CurrentUser() user: JwtPayloadVo, @Param('rewardId') rewardId: string) {
    const { redemption, reward, balance } = await this.loyalty.redeem(user.sub, rewardId);
    await this.notify.execute({
      userId: user.sub,
      type: 'LOYALTY',
      message: t.rewardRedeemed(reward.name, redemption.code),
    });
    return { code: redemption.code, reward: reward.name, balance };
  }

  @Post('rewards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a reward (OWNER only)' })
  createReward(@Body() dto: CreateRewardDto) {
    return this.prisma.reward.create({ data: dto });
  }

  @Post('grant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adjust points by hand, with a reason (OWNER / STAFF)' })
  async grant(@Body() dto: GrantPointsDto) {
    const balance = await this.loyalty.addPoints(dto.userId, dto.delta, 'MANUAL', {
      note: dto.note,
    });
    return { userId: dto.userId, balance };
  }
}
