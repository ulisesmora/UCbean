import { Injectable, Logger } from '@nestjs/common';
import { Email, IMailer } from '../../domain/ports/mailer.port';

/**
 * El correo que no sale a ningún lado.
 *
 * Se usa mientras no haya `RESEND_API_KEY`. Escribe el mensaje entero
 * en el log, incluido el enlace de validación, para poder probar el
 * alta de una cuenta sin dominio verificado ni cuenta de terceros.
 *
 * Nunca se elige en producción: el arranque falla si falta la llave y
 * `NODE_ENV` es production, en lugar de tragarse los correos en
 * silencio, que es la forma más cara de descubrir el problema.
 */
@Injectable()
export class LogMailer implements IMailer {
  private readonly logger = new Logger('Correo (sin enviar)');

  async send(email: Email): Promise<void> {
    this.logger.log(
      `\n  Para:    ${email.to}\n  Asunto:  ${email.subject}\n  ${email.text.replace(/\n/g, '\n  ')}`,
    );
  }
}
