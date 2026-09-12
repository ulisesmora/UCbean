import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayloadVo } from '../../../auth/domain/value-objects/jwt-payload.vo';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RegisterPushDto } from '../dtos/notifications.dto';

/**
 * La bandeja del cliente, y su alta para avisos push.
 *
 * La suscripción push se guarda aquí aunque el envío todavía no esté
 * conectado: sin las suscripciones guardadas desde el primer día, el
 * día que se encienda no habría a quién avisar.
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Mis avisos, del más reciente al más viejo' })
  @ApiQuery({ name: 'unread', required: false, example: 'true' })
  async mine(@CurrentUser() user: JwtPayloadVo, @Query('unread') unread?: string) {
    return this.prisma.notification.findMany({
      where: { userId: user.sub, ...(unread === 'true' ? { isRead: false } : {}) },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar un aviso como leído' })
  async markRead(@CurrentUser() user: JwtPayloadVo, @Param('id') id: string) {
    // El userId va en el where, no solo el id: sin él cualquiera podría
    // marcar como leídos los avisos de otra persona.
    await this.prisma.notification.updateMany({
      where: { id, userId: user.sub },
      data: { isRead: true },
    });
    return { ok: true };
  }

  @Post('push')
  @ApiOperation({ summary: 'Registrar este navegador para avisos push' })
  async registerPush(@CurrentUser() user: JwtPayloadVo, @Body() dto: RegisterPushDto) {
    // El endpoint es único por navegador. Volver a suscribirse desde el
    // mismo equipo actualiza, no duplica.
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: { userId: user.sub, p256dh: dto.p256dh, auth: dto.auth, lastUsedAt: new Date() },
      create: {
        userId: user.sub,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
        userAgent: dto.userAgent,
      },
    });
    return { ok: true };
  }

  @Delete('push')
  @ApiOperation({ summary: 'Dar de baja este navegador' })
  async unregisterPush(@CurrentUser() user: JwtPayloadVo, @Body() dto: { endpoint: string }) {
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint: dto.endpoint, userId: user.sub },
    });
    return { ok: true };
  }
}
