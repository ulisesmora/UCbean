import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { SendNotificationUseCase } from '../../../notifications/application/use-cases/send-notification.use-case';
import * as t from '../../../notifications/domain/templates';

/** Cuánto vive cada enlace. Verificar no corre prisa; cambiar la clave sí. */
const HORAS = { EMAIL_VERIFY: 24, PASSWORD_RESET: 1 } as const;

type Purpose = keyof typeof HORAS;

/**
 * Verificar el correo y recuperar la contraseña.
 *
 * Las dos cosas son el mismo mecanismo: un token de un solo uso que viaja
 * por correo. Lo que cambia es qué se hace al canjearlo y cuánto dura.
 *
 * El token se guarda como hash, igual que una contraseña. Si alguien lee
 * la base no puede usarlo, que es justo lo que hace peligroso guardar el
 * texto plano de un enlace que cambia contraseñas.
 */
@Injectable()
export class AccountUseCase {
  private readonly logger = new Logger(AccountUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: SendNotificationUseCase,
    private readonly config: ConfigService,
  ) {}

  private hash = (token: string) => createHash('sha256').update(token).digest('hex');

  private link(purpose: Purpose, token: string): string {
    const base = this.config.get<string>('APP_URL') ?? 'http://localhost:3001';
    // En inglés porque la web pública lo está: sus clientes son del campus
    // de UBC. El CRM va en español porque lo usa el personal.
    const ruta = purpose === 'EMAIL_VERIFY' ? 'verify-email' : 'reset-password';
    return `${base}/${ruta}?token=${token}`;
  }

  /**
   * Crea un token y devuelve el texto plano, que solo viaja en el correo.
   *
   * Antes de crear uno nuevo se invalidan los anteriores del mismo tipo:
   * pedir el enlace tres veces no puede dejar tres llaves vivas.
   */
  private async issue(userId: string, purpose: Purpose): Promise<string> {
    const token = randomBytes(32).toString('base64url');

    await this.prisma.verificationToken.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.verificationToken.create({
      data: {
        userId,
        purpose,
        tokenHash: this.hash(token),
        expiresAt: new Date(Date.now() + HORAS[purpose] * 3600_000),
      },
    });

    return token;
  }

  /** Canjea un token y devuelve de quién era, o falla diciendo por qué. */
  private async redeem(token: string, purpose: Purpose): Promise<string> {
    const fila = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: this.hash(token) },
    });

    if (!fila || fila.purpose !== purpose) {
      throw new BadRequestException('That link is not valid. Request a new one.');
    }
    if (fila.usedAt) {
      throw new BadRequestException('That link was already used. Request a new one.');
    }
    if (fila.expiresAt < new Date()) {
      throw new BadRequestException('That link has expired. Request a new one.');
    }

    // Se marca usado antes de hacer nada: si el resto falla, el token ya no
    // sirve, que es el lado seguro en el que equivocarse.
    await this.prisma.verificationToken.update({
      where: { id: fila.id },
      data: { usedAt: new Date() },
    });

    return fila.userId;
  }

  /** Manda el enlace de verificación. Lo llama el alta y el botón de reenviar. */
  async sendVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, emailVerifiedAt: true },
    });
    if (!user || user.emailVerifiedAt) return;

    const token = await this.issue(userId, 'EMAIL_VERIFY');
    await this.notify.execute({
      userId,
      type: 'ACCOUNT',
      message: t.verifyEmail(user.name, this.link('EMAIL_VERIFY', token)),
      // Solo correo: un aviso en la cuenta pidiendo verificar el correo lo
      // lee quien ya entró, que es justo quien no lo necesita.
      channels: { email: true, inApp: false },
    });
  }

  async verifyEmail(token: string) {
    const userId = await this.redeem(token, 'EMAIL_VERIFY');
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
      select: { id: true, name: true, email: true },
    });
    this.logger.log(`Correo verificado: ${user.email}`);
    return { verified: true, ...user };
  }

  /**
   * Arranca el cambio de contraseña.
   *
   * Responde lo mismo exista la cuenta o no. Decir «ese correo no está
   * registrado» convierte esta ruta en una forma de averiguar quién tiene
   * cuenta aquí, que es información de los clientes, no nuestra.
   */
  async requestPasswordReset(email: string): Promise<{ ok: true }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, name: true },
    });

    if (user) {
      const token = await this.issue(user.id, 'PASSWORD_RESET');
      await this.notify.execute({
        userId: user.id,
        type: 'ACCOUNT',
        message: t.resetPassword(user.name, this.link('PASSWORD_RESET', token)),
        channels: { email: true, inApp: false },
      });
    } else {
      this.logger.warn(`Recuperación pedida para un correo que no existe: ${email}`);
    }

    return { ok: true };
  }

  /**
   * Cierra el cambio de contraseña.
   *
   * Además de cambiarla, borra el refresh token: si alguien entró con la
   * contraseña vieja, cambiarla tiene que echarlo, o recuperar la cuenta no
   * sirve de nada.
   */
  async resetPassword(token: string, password: string) {
    if (password.length < 8) {
      throw new BadRequestException('The password needs at least 8 characters');
    }

    const userId = await this.redeem(token, 'PASSWORD_RESET');
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        refreshToken: null,
      },
    });

    this.logger.log(`Contraseña cambiada para ${userId}`);
    return { ok: true };
  }
}
