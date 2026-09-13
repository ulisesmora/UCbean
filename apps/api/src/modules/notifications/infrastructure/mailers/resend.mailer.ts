import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Email, IMailer } from '../../domain/ports/mailer.port';

/**
 * Correo por Resend.
 *
 * Sin librería: su API es un POST con JSON y Node 22 ya trae `fetch`.
 * Meter un SDK para una sola llamada añade una dependencia que hay
 * que actualizar durante años a cambio de nada.
 */
@Injectable()
export class ResendMailer implements IMailer {
  private readonly logger = new Logger(ResendMailer.name);
  private readonly key: string;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.key = config.getOrThrow<string>('RESEND_API_KEY');
    this.from = config.get<string>('MAIL_FROM') ?? 'Around the Bean <hola@aroundthebean.ca>';
  }

  async send(email: Email): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        ...(email.html ? { html: email.html } : {}),
      }),
    });

    if (!res.ok) {
      // El cuerpo del error de Resend dice cuál es el problema: dominio
      // sin verificar, destinatario inválido, cuota. Sin él, depurar un
      // correo que no llega es adivinar.
      const detail = await res.text().catch(() => '');
      throw new Error(`Resend responded ${res.status}: ${detail.slice(0, 300)}`);
    }

    this.logger.log(`Correo enviado a ${email.to}: ${email.subject}`);
  }
}
