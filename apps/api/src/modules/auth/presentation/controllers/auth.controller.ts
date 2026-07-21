import {
  Body, Controller, HttpCode, HttpStatus,
  Post, Req, Res, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayloadVo } from '../../domain/value-objects/jwt-payload.vo';

const REFRESH_COOKIE = 'refresh_token';
const cookieOpts = (secure: boolean) => ({
  httpOnly: true,
  secure,
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 3600,
});

@Controller('auth')
export class AuthController {
  private readonly secure = process.env.NODE_ENV === 'production';

  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: FastifyReply) {
    const { accessToken, refreshToken, user } = await this.registerUseCase.execute(dto);
    res.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts(this.secure));
    return { accessToken, user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: FastifyReply) {
    const { accessToken, refreshToken, user } = await this.loginUseCase.execute(dto);
    res.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts(this.secure));
    return { accessToken, user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const token = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException('Missing refresh token');
    const { accessToken, refreshToken } = await this.refreshUseCase.execute(token);
    res.setCookie(REFRESH_COOKIE, refreshToken, cookieOpts(this.secure));
    return { accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: JwtPayloadVo, @Res({ passthrough: true }) res: FastifyReply) {
    await this.logoutUseCase.execute(user.sub);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  }
}
