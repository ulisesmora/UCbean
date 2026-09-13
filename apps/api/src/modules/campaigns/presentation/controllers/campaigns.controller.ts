import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CampaignsService } from '../../application/use-cases/campaigns.service';
import type { Audience } from '../../domain/audience';
import { CreateCampaignDto } from '../dtos/campaigns.dto';

/**
 * Campañas, solo para el dueño.
 *
 * Escribir a toda la lista de clientes no es una acción que deba poder
 * disparar el personal de barra, así que ni siquiera STAFF entra aquí.
 */
@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class CampaignsController {
  constructor(
    private readonly campaigns: CampaignsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'All campaigns, with delivery counts' })
  list() {
    return this.prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { deliveries: true } } },
    });
  }

  @Get('audience')
  @ApiOperation({ summary: 'A cuánta gente le llegaría, antes de mandar nada' })
  @ApiQuery({ name: 'audience', enum: ['ALL', 'WITH_POINTS', 'BIRTHDAY_MONTH', 'INACTIVE'] })
  async audience(@Query('audience') audience: Audience) {
    const people = await this.campaigns.recipients(audience ?? 'ALL');
    return { total: people.length, sample: people.slice(0, 10).map((p) => p.name) };
  }

  @Post()
  @ApiOperation({ summary: 'Create a campaign, as a draft or scheduled' })
  create(@Body() dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        ...dto,
        status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      },
    });
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send it now. A sent campaign is never repeated.' })
  send(@Param('id') id: string) {
    return this.campaigns.send(id);
  }
}
