import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayloadVo } from '../../domain/value-objects/jwt-payload.vo';
import { AccountUseCase } from '../../application/use-cases/account.use-case';
import { GoogleAuthUseCase } from '../../application/use-cases/google-auth.use-case';
import { GoogleTokenDto } from '../dtos/google-token.dto';

const REFRESH_COOKIE = 'refresh_token';
const cookieOpts = (secure: boolean) => ({
  httpOnly: true,
  secure,
  // Strict when the web and the API share a site (example.com and
  // api.example.com). On different sites, say a vercel.app web and a
  // railway.app API, the browser only sends it back with 'none', which also
  // requires the secure flag that production already sets.
  sameSite: (process.env.COOKIE_SAMESITE ?? 'strict') as 'strict' | 'lax' | 'none',
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 3600,
});

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly secure = process.env.NODE_ENV === 'production';

  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly account: AccountUseCase,
    private readonly google: GoogleAuthUseCase,
    private readonly refreshUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: any) {
    const { accessToken, refreshToken, user } = await this.registerUseCase.execute(dto);
    res.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts(this.secure));

    // El enlace de verificacion sale aqui y no dentro del caso de uso: el
    // alta ya termino y devolvio sesion, asi que un correo que falle no
    // puede tumbar un registro que ya esta hecho.
    await this.account.sendVerification(user.id);

    return { accessToken, user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive access + refresh tokens' })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: any) {
    const { accessToken, refreshToken, user } = await this.loginUseCase.execute(dto);
    res.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts(this.secure));
    return { accessToken, user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate access token using httpOnly refresh cookie' })
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const token = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException('Missing refresh token');
    const { accessToken, refreshToken } = await this.refreshUseCase.execute(token);
    res.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts(this.secure));
    return { accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — clears refresh token hash and cookie' })
  async logout(@CurrentUser() user: JwtPayloadVo, @Res({ passthrough: true }) res: any) {
    await this.logoutUseCase.execute(user.sub);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  }

  /* ── Verificar el correo ──────────────────────────────────── */

  @Post('verify-email/resend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Volver a mandar el enlace de verificacion' })
  @HttpCode(HttpStatus.OK)
  async resendVerification(@CurrentUser() user: JwtPayloadVo) {
    await this.account.sendVerification(user.sub);
    return { ok: true };
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Canjear el enlace de verificacion' })
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() body: { token: string }) {
    if (!body?.token) throw new BadRequestException('Token is missing');
    return this.account.verifyEmail(body.token);
  }

  /* ── Recuperar la contrasena ──────────────────────────────── */

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request a password reset link',
    description:
      'Answers the same whether or not the account exists. Saying which one exists would turn this route ' +
      'into a way to find out who has an account here.',
  })
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: { email: string }) {
    if (!body?.email) throw new BadRequestException('Email is missing');
    return this.account.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Change the password with the link' })
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() body: { token: string; password: string }) {
    if (!body?.token || !body?.password) {
      throw new BadRequestException('Token or password is missing');
    }
    return this.account.resetPassword(body.token, body.password);
  }

  /* ── Entrar con Google ────────────────────────────────────── */

  @Get('google')
  @ApiOperation({
    summary: 'Start Google sign-in',
    description: 'Redirige a Google. El navegador vuelve solo a /auth/google/callback.',
  })
  googleStart(@Res() reply: any) {
    // `state` vuelve intacto y se compara al regresar: sirve para saber que
    // la respuesta corresponde a una peticion que salio de aqui.
    const state = randomBytes(16).toString('base64url');
    reply
      .setCookie('google_state', state, {
        httpOnly: true,
        secure: this.secure,
        sameSite: 'lax' as const,
        path: '/api/v1/auth',
        maxAge: 600,
      })
      .redirect(this.google.authUrl(state), 302);
  }

  @Post('google/token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in with Google without leaving the page',
    description:
      'Takes the `credential` from the Google button in the browser and checks it with Google before trusting it.',
  })
  async googleToken(@Body() dto: GoogleTokenDto, @Res({ passthrough: true }) res: any) {
    const { accessToken, refreshToken, user } = await this.google.signInWithIdToken(dto.credential);
    res.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts(this.secure));
    return { accessToken, user };
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google callback. Redirects to the website already signed in.' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Req() req: any,
    @Res() reply: any,
  ) {
    const web = process.env.APP_URL ?? 'http://localhost:3001';

    if (error || !code) {
      return reply.redirect(`${web}/profile?error=google`, 302);
    }

    // Sin esta comprobacion, cualquiera podria forzar una vuelta de Google
    // fabricada desde otro sitio.
    if (!state || state !== req.cookies?.google_state) {
      return reply.redirect(`${web}/profile?error=estado`, 302);
    }

    try {
      const { accessToken, refreshToken, esNuevo } = await this.google.signIn(code);

      reply
        .clearCookie('google_state', { path: '/api/v1/auth' })
        .setCookie(REFRESH_COOKIE, refreshToken, cookieOpts(this.secure))
        // El token de acceso viaja en el fragmento de la URL, que no se
        // manda al servidor ni queda en los registros del proxy. La web lo
        // recoge y lo borra de la barra de direcciones.
        .redirect(`${web}/profile#token=${accessToken}&nuevo=${esNuevo ? '1' : '0'}`, 302);
    } catch (e) {
      return reply.redirect(`${web}/profile?error=google`, 302);
    }
  }
}
