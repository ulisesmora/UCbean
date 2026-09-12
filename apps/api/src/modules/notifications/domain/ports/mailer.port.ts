export const MAILER = Symbol('MAILER');

export interface Email {
  to: string;
  subject: string;
  /** Texto plano. El HTML lo arma el proveedor a partir de esto. */
  text: string;
  html?: string;
}

/**
 * Quien pone los correos en la calle.
 *
 * Hay dos implementaciones de verdad, no una con adorno: Resend en
 * producción y una que escribe en el log mientras no haya llave. El
 * desarrollo local no debería exigir una cuenta de un tercero para
 * poder registrar un usuario.
 */
export interface IMailer {
  send(email: Email): Promise<void>;
}
