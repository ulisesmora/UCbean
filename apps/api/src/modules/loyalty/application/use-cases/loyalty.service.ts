import { esDuplicado } from '../../../../prisma/transaction';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../../../prisma/prisma.service';
import { canAfford, pointsForOrder, STAMPS_PER_ORDER } from '../../domain/points-policy';

export type PointsReason = 'ORDER' | 'SIGNUP' | 'BIRTHDAY' | 'REDEMPTION' | 'MANUAL' | 'EXPIRY';

/**
 * La tarjeta de lealtad.
 *
 * El saldo no se guarda en ninguna columna: se suma del libro de
 * movimientos cada vez que se pide. Un contador mutable se descuadra en
 * cuanto una operación falla a medias, y entonces nadie sabe cuál de
 * los dos números es el bueno. Sumar una lista corta es barato, y
 * «tienes tantos puntos» es una cifra que el cliente se va a creer.
 */
@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  /** La tarjeta de alguien, creada al vuelo la primera vez. */
  async cardFor(userId: string): Promise<{ id: string; stamps: number }> {
    const existing = await this.prisma.loyaltyCard.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.loyaltyCard.create({ data: { userId } });
  }

  async balanceOf(userId: string): Promise<number> {
    const card = await this.prisma.loyaltyCard.findUnique({ where: { userId } });
    if (!card) return 0;
    const sum = await this.prisma.pointsEntry.aggregate({
      where: { cardId: card.id },
      _sum: { delta: true },
    });
    return sum._sum.delta ?? 0;
  }

  /** Apunta un movimiento y devuelve el saldo que queda. */
  async addPoints(
    userId: string,
    delta: number,
    reason: PointsReason,
    extra: { orderId?: string; note?: string } = {},
  ): Promise<number> {
    const card = await this.cardFor(userId);
    try {
      await this.prisma.pointsEntry.create({
        data: { cardId: card.id, delta, reason, orderId: extra.orderId, note: extra.note },
      });
    } catch (e) {
      // El índice único (pedido, motivo) es lo que impide dar dos veces los
      // puntos de un mismo pedido. Si choca, ya se dieron: no es un error.
      if (!esDuplicado(e)) throw e;
    }
    return this.balanceOf(userId);
  }

  /** Lo que deja un pedido: puntos y un sello. */
  async rewardOrder(userId: string, orderId: string, total: number): Promise<number> {
    const points = pointsForOrder(total);
    const card = await this.cardFor(userId);

    // El sello también se da una sola vez por pedido. Sin esta comprobación
    // un aviso repetido sumaría dos sellos aunque el índice frene los puntos.
    const yaPremiado = await this.prisma.pointsEntry.findFirst({
      where: { orderId, reason: 'ORDER' },
      select: { id: true },
    });
    if (yaPremiado) return this.balanceOf(userId);

    await this.prisma.loyaltyCard.update({
      where: { id: card.id },
      data: { stamps: { increment: STAMPS_PER_ORDER } },
    });

    if (points === 0) return this.balanceOf(userId);
    return this.addPoints(userId, points, 'ORDER', { orderId });
  }

  async movements(userId: string) {
    const card = await this.prisma.loyaltyCard.findUnique({ where: { userId } });
    if (!card) return [];
    return this.prisma.pointsEntry.findMany({
      where: { cardId: card.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Cambia puntos por un premio.
   *
   * El cargo se apunta como un movimiento negativo, no borrando nada,
   * para que el historial siga cuadrando. El código es lo que el cliente
   * enseña en el mostrador: seis caracteres sin O ni 0 ni I ni 1, porque
   * se lee en voz alta en un sitio con ruido.
   */
  async redeem(userId: string, rewardId: string) {
    const reward = await this.prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward || !reward.isActive) throw new NotFoundException('Reward not found');

    const balance = await this.balanceOf(userId);
    if (!canAfford(balance, reward.cost)) {
      throw new BadRequestException(
        `You need ${reward.cost - balance} more points for ${reward.name}`,
      );
    }

    const card = await this.cardFor(userId);
    const code = redemptionCode();

    // Las dos escrituras van juntas: cobrar los puntos sin entregar el
    // canje, o al revés, deja al cliente con un problema que no causó.
    const [, redemption] = await this.prisma.$transaction([
      this.prisma.pointsEntry.create({
        data: {
          cardId: card.id,
          delta: -reward.cost,
          reason: 'REDEMPTION',
          note: reward.name,
        },
      }),
      this.prisma.rewardRedemption.create({
        data: { cardId: card.id, rewardId: reward.id, code },
      }),
    ]);

    return { redemption, reward, balance: balance - reward.cost };
  }
}

function redemptionCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}
