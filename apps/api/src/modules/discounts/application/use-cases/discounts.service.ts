import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  checkDiscount,
  discountAmount,
  reasonText,
  type DiscountRule,
} from '../../domain/discount-policy';

export interface AppliedDiscount {
  discountId: string;
  code: string;
  amount: number;
}

/**
 * Códigos de descuento.
 *
 * Un descuento con `userId` es un regalo para esa persona: el de
 * bienvenida, el de cumpleaños. Sin `userId` lo puede usar cualquiera.
 * Una sola tabla porque la regla de si vale o no es exactamente la
 * misma en los dos casos.
 */
@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lo que la app enseña en «mis cupones». */
  async availableFor(userId: string) {
    const now = new Date();
    return this.prisma.discount.findMany({
      where: {
        isActive: true,
        OR: [{ userId }, { userId: null }],
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Calcula el descuento sin gastarlo.
   *
   * Lo usa el carrito para enseñar el total antes de pedir. Devuelve el
   * motivo en palabras cuando no vale, porque «código inválido» hace que
   * el cliente lo intente tres veces y luego escriba a preguntar.
   */
  async preview(code: string, userId: string, orderTotal: number): Promise<AppliedDiscount> {
    const discount = await this.prisma.discount.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!discount) throw new NotFoundException('Ese código no existe');

    const [globalUses, userUses] = await Promise.all([
      this.prisma.discountRedemption.count({ where: { discountId: discount.id } }),
      this.prisma.discountRedemption.count({ where: { discountId: discount.id, userId } }),
    ]);

    const rule = toRule(discount);
    const rejection = checkDiscount(rule, { userId, orderTotal, globalUses, userUses });
    if (rejection) throw new BadRequestException(reasonText(rejection));

    return {
      discountId: discount.id,
      code: discount.code,
      amount: discountAmount(rule, orderTotal),
    };
  }

  /**
   * Lo gasta, ya asociado a un pedido.
   *
   * Se vuelve a comprobar todo aunque `preview` acabe de decir que sí.
   * Entre ver el total y confirmar el pedido pueden pasar minutos, y el
   * último uso de un código se lo puede llevar otra persona.
   */
  async consume(
    code: string,
    userId: string,
    orderTotal: number,
    orderId: string,
  ): Promise<AppliedDiscount> {
    const applied = await this.preview(code, userId, orderTotal);
    await this.prisma.discountRedemption.create({
      data: {
        discountId: applied.discountId,
        userId,
        orderId,
        amount: applied.amount,
      },
    });
    return applied;
  }

  /**
   * Regala un código personal.
   *
   * `trigger` evita duplicados: alguien solo recibe una bienvenida, y un
   * cumpleaños al año. Si ya lo tiene, devuelve el que ya tenía en vez
   * de crear otro, que es lo que llena el buzón de cupones repetidos.
   */
  async grantPersonal(
    userId: string,
    trigger: 'SIGNUP' | 'BIRTHDAY' | 'FIRST_APP_ORDER',
    spec: { kind: 'PERCENT' | 'AMOUNT'; value: number; description: string; days: number },
  ) {
    const since = trigger === 'BIRTHDAY' ? new Date(Date.now() - 300 * 24 * 3600_000) : new Date(0);

    const existing = await this.prisma.discount.findFirst({
      where: { userId, trigger, createdAt: { gte: since } },
    });
    if (existing) return existing;

    const endsAt = new Date(Date.now() + spec.days * 24 * 3600_000);
    return this.prisma.discount.create({
      data: {
        code: personalCode(trigger),
        description: spec.description,
        kind: spec.kind,
        value: spec.value,
        perUserLimit: 1,
        maxRedemptions: 1,
        endsAt,
        userId,
        trigger,
      },
    });
  }
}

function toRule(d: {
  kind: string;
  value: { toNumber(): number } | number;
  minOrderTotal: { toNumber(): number } | number | null;
  maxRedemptions: number | null;
  perUserLimit: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  userId: string | null;
}): DiscountRule {
  const num = (v: { toNumber(): number } | number) => (typeof v === 'number' ? v : v.toNumber());
  return {
    kind: d.kind as 'PERCENT' | 'AMOUNT',
    value: num(d.value),
    minOrderTotal: d.minOrderTotal === null ? null : num(d.minOrderTotal),
    maxRedemptions: d.maxRedemptions,
    perUserLimit: d.perUserLimit,
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    isActive: d.isActive,
    userId: d.userId,
  };
}

/**
 * El código que se lee en voz alta o se teclea en el móvil.
 *
 * Prefijo que dice de qué es, y cinco caracteres sin O ni 0 ni I ni 1,
 * que son los que todo el mundo confunde.
 */
function personalCode(trigger: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const prefix = { SIGNUP: 'HOLA', BIRTHDAY: 'CUMPLE', FIRST_APP_ORDER: 'APP' }[trigger] ?? 'BEAN';
  const suffix = Array.from(randomBytes(5), (b) => alphabet[b % alphabet.length]).join('');
  return `${prefix}${suffix}`;
}
