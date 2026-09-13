import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CLOSE_HOUR,
  MAX_PER_SLOT,
  OPEN_HOUR,
} from '../reservations/application/use-cases/get-available-slots.use-case';

/** Cómo de llena está la barra, en palabras. */
export type Pulse = 'quiet' | 'steady' | 'busy';

/**
 * El pulso del local.
 *
 * Responde a la única pregunta que se hace quien está a diez minutos
 * andando: ¿merece la pena ir ahora?
 *
 * Deliberadamente NO dice «quedan tres mesas». Las mesas se ocupan y se
 * dejan sin que nadie lo teclee, así que ese número envejece en minutos y
 * un dato viejo es peor que ninguno: manda a alguien a cruzar el campus
 * hacia una mesa que no existe. Lo que sí sabemos de verdad es cuánto
 * trabajo tiene la barra ahora mismo, y eso sale de la cola de pedidos sin
 * que nadie tenga que mantener nada.
 */
@ApiTags('Cafe')
@Controller('cafe')
export class CafeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('pulse')
  @ApiOperation({
    summary: 'Whether it is open and how busy it is',
    description: 'Public: the website reads it before anyone signs in.',
  })
  async pulse() {
    const ahora = new Date();
    const hora = ahora.getHours();
    const abierto = hora >= OPEN_HOUR && hora < CLOSE_HOUR;

    const finDeDia = new Date(ahora);
    finDeDia.setHours(23, 59, 59, 999);

    const [enCola, reservasHoy, mesas] = await Promise.all([
      this.prisma.order.count({
        where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } },
      }),
      this.prisma.tableReservation.count({
        where: { scheduledAt: { gte: ahora, lte: finDeDia }, status: { not: 'CANCELLED' } },
      }),
      this.prisma.table.count({ where: { isActive: true } }),
    ]);

    // La escala es la capacidad real de un hueco de quince minutos: por
    // debajo de un tercio la barra va sobrada, por encima de dos tercios
    // vas a esperar.
    const pulse: Pulse =
      enCola >= MAX_PER_SLOT ? 'busy' : enCola >= Math.ceil(MAX_PER_SLOT / 3) ? 'steady' : 'quiet';

    return {
      open: abierto,
      opensAt: OPEN_HOUR,
      closesAt: CLOSE_HOUR,
      pulse: abierto ? pulse : ('quiet' as Pulse),
      /** Pedidos por delante del tuyo si pides ahora. */
      queueDepth: enCola,
      /** Minutos de espera estimados, redondeados a los cinco de arriba. */
      waitMinutes: abierto ? Math.max(5, Math.ceil((enCola * 2.5) / 5) * 5) : null,
      tables: mesas,
      tablesBooked: reservasHoy,
    };
  }
}
