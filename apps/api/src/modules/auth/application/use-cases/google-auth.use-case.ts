import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { JwtPayloadVo } from '../../domain/value-objects/jwt-payload.vo';
import { Role } from '../../../users/domain/value-objects/role.enum';
import { EVENTS, type UserRegisteredEvent } from '../../../../common/events/domain-events';
import { sessionTtlSeconds } from '../../domain/value-objects/session-ttl';

/** Lo que Google devuelve de la persona. Solo se pide lo que se usa. */
interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
}

/**
 * Entrar con Google.
 *
 * Sin SDK: son dos llamadas HTTP. El navegador va a Google, vuelve con un
 * código, y aquí se cambia ese código por los datos de la persona. Misma
 * decisión que con Stripe y Resend, y por el mismo motivo.
 *
 * El flujo es el de servidor (`code`), no el implícito: el token de Google
 * nunca pasa por el navegador del cliente.
 */
@Injectable()
export class GoogleAuthUseCase {
  private readonly logger = new Logger(GoogleAuthUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly events: EventEmitter2,
  ) {}

  get enabled(): boolean {
    return Boolean(
      this.config.get<string>('GOOGLE_CLIENT_ID') &&
      this.config.get<string>('GOOGLE_CLIENT_SECRET'),
    );
  }

  private redirectUri(): string {
    const base = this.config.get<string>('API_URL') ?? 'http://localhost:3000/api/v1';
    return `${base}/auth/google/callback`;
  }

  /**
   * A dónde mandar el navegador.
   *
   * `state` es un valor aleatorio que vuelve intacto; sirve para comprobar
   * que la respuesta corresponde a una petición que salió de aquí y no a
   * una que alguien fabricó.
   */
  authUrl(state: string): string {
    if (!this.enabled) {
      throw new ServiceUnavailableException(
        'Google sign-in is not configured. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are missing.',
      );
    }

    const params = new URLSearchParams({
      client_id: this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      redirect_uri: this.redirectUri(),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      // Sin esto, quien ya entró una vez no vuelve a ver la pantalla de
      // Google y no puede cambiar de cuenta.
      prompt: 'select_account',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  /** Cambia el código por el perfil, hablando con Google de servidor a servidor. */
  private async exchange(code: string): Promise<GoogleProfile> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
        client_secret: this.config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
        redirect_uri: this.redirectUri(),
        grant_type: 'authorization_code',
      }),
    });

    const token = (await res.json()) as Record<string, string>;
    if (!res.ok) {
      this.logger.error(`Google rechazó el código: ${token.error_description ?? token.error}`);
      throw new BadRequestException('Google did not accept the sign-in. Please try again.');
    }

    const perfil = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!perfil.ok) throw new BadRequestException('Could not read your Google profile');

    return (await perfil.json()) as GoogleProfile;
  }

  /**
   * Entra o crea la cuenta, y devuelve los tokens de siempre.
   *
   * Si el correo ya existe se enlaza en vez de fallar: alguien que se
   * registró con contraseña y luego pulsa «entrar con Google» espera entrar
   * en su cuenta, no que le digan que ya existe.
   *
   * La contraseña de una cuenta creada así es aleatoria y nadie la conoce.
   * Para poner una, se usa el mismo flujo de recuperar contraseña.
   */
  async signIn(code: string) {
    return this.sesionPara(await this.exchange(code));
  }

  /**
   * Entrar sin salir de la página.
   *
   * El botón de Google en el navegador devuelve un `credential`: un JWT
   * firmado por Google con los datos de la persona. No se cree nada de lo
   * que diga ese token hasta que Google mismo lo confirma, porque es el
   * cliente quien lo trae y cualquiera puede inventarse uno.
   *
   * Se comprueba con el endpoint de Google en vez de verificar la firma a
   * mano: es una llamada HTTP y nos ahorra manejar su juego de claves
   * públicas y su rotación. Misma razón que en el resto del proyecto.
   */
  async signInWithIdToken(credential: string) {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
    );
    if (!res.ok) {
      throw new BadRequestException('Google does not recognise that credential');
    }

    const datos = (await res.json()) as {
      aud?: string;
      email?: string;
      email_verified?: string | boolean;
      name?: string;
      given_name?: string;
      exp?: string;
    };

    // El `aud` es lo que impide que sirva un token emitido para otra
    // aplicación: sin esta comprobación, cualquiera con una cuenta de
    // Google en cualquier web podría entrar aquí con su token.
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId || datos.aud !== clientId) {
      throw new BadRequestException('That credential is not for this app');
    }

    if (datos.exp && Number(datos.exp) * 1000 < Date.now()) {
      throw new BadRequestException('That credential has expired');
    }

    if (!datos.email) {
      throw new BadRequestException('Google did not return an email');
    }

    return this.sesionPara({
      email: datos.email,
      // El endpoint devuelve los booleanos como texto.
      email_verified: datos.email_verified === true || datos.email_verified === 'true',
      name: datos.name,
      given_name: datos.given_name,
    } as GoogleProfile);
  }

  /** De un perfil de Google a una sesión nuestra. Igual venga por donde venga. */
  private async sesionPara(perfil: GoogleProfile) {
    if (!perfil.email_verified) {
      throw new BadRequestException('Google says that email is not verified');
    }

    const email = perfil.email.toLowerCase();
    const existente = await this.prisma.user.findUnique({ where: { email } });

    let user = existente;
    let esNuevo = false;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: perfil.name ?? perfil.given_name ?? email.split('@')[0],
          passwordHash: await bcrypt.hash(randomBytes(32).toString('base64'), 12),
          // Google ya comprobó el correo. Pedirlo otra vez sería repetir
          // una verificación que alguien más ya hizo mejor.
          emailVerifiedAt: new Date(),
        },
      });
      esNuevo = true;
    } else if (!user.emailVerifiedAt) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
    }

    const payload: JwtPayloadVo = { sub: user.id, email: user.email, role: user.role as Role };
    const accessToken = this.jwt.sign(payload, { expiresIn: sessionTtlSeconds(payload.role) });
    const refreshToken = this.jwt.sign(payload, { expiresIn: sessionTtlSeconds(payload.role) });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: await bcrypt.hash(refreshToken, 10) },
    });

    // Los puntos de bienvenida y el cupón cuelgan de aquí, igual que en el
    // alta normal, y solo si de verdad es una cuenta nueva.
    if (esNuevo) {
      this.events.emit(EVENTS.userRegistered, {
        userId: user.id,
        email: user.email,
        name: user.name,
      } satisfies UserRegisteredEvent);
      this.logger.log(`Cuenta creada con Google: ${email}`);
    }

    return { accessToken, refreshToken, user, esNuevo };
  }
}
