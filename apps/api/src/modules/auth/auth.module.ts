import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { AccountUseCase } from './application/use-cases/account.use-case';
import { GoogleAuthUseCase } from './application/use-cases/google-auth.use-case';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    NotificationsModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    AccountUseCase,
    GoogleAuthUseCase,
    JwtStrategy,
  ],
  exports: [AccountUseCase],
  controllers: [AuthController],
})
export class AuthModule {}
