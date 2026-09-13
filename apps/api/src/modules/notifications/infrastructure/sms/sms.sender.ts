import { Injectable, Logger } from '@nestjs/common';

/**
 * El mensaje de texto.
 *
 * Twilio es una API HTTP normal —autenticación básica y un formulario— así
 * que va con `fetch` directo, igual que Resend y Stripe. Una dependencia
 * menos que actualizar.
 *
 * Sin credenciales escribe en el log en vez de enviar, para poder probar el
 * flujo sin gastar créditos ni dar de alta un número.
 */
@Injectable()
export class SmsSender {
  private readonly logger = new Logger('SMS');
  private readonly sid = process.env.TWILIO_ACCOUNT_SID;
  private readonly token = process.env.TWILIO_AUTH_TOKEN;
  private readonly from = process.env.TWILIO_FROM;

  private get activo(): boolean {
    return Boolean(this.sid && this.token && this.from);
  }

  /**
   * Manda un SMS. Devuelve si salió de verdad.
   *
   * El texto se recorta a 320 caracteres, que son dos segmentos: a partir
   * de ahí cada trozo se cobra aparte y un aviso de cafetería no necesita
   * más. Recortar aquí evita una factura sorpresa.
   */
  async send(to: string, text: string): Promise<boolean> {
    const cuerpo = text.length > 320 ? `${text.slice(0, 317)}...` : text;

    if (!this.activo) {
      this.logger.log(`[sin enviar] SMS a ${to}: ${cuerpo}`);
      return false;
    }

    const auth = Buffer.from(`${this.sid}:${this.token}`).toString('base64');

    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: to, From: this.from!, Body: cuerpo }),
        },
      );

      if (!res.ok) {
        const detalle = await res.text().catch(() => '');
        this.logger.error(`Twilio respondió ${res.status}: ${detalle.slice(0, 200)}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(`No se pudo mandar el SMS a ${to}: ${(error as Error).message}`);
      return false;
    }
  }
}
