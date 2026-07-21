import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { IUserRepository, USER_REPOSITORY } from '../../../users/domain/repositories/user.repository.interface';
import { JwtPayloadVo } from '../../domain/value-objects/jwt-payload.vo';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly jwt: JwtService,
  ) {}

  async execute(rawRefreshToken: string) {
    // Decode without verification to get the subject (userId)
    const decoded = this.jwt.decode<JwtPayloadVo>(rawRefreshToken);
    if (!decoded?.sub) throw new UnauthorizedException();

    const storedHash = await this.users.findRefreshTokenHash(decoded.sub);
    if (!storedHash) throw new UnauthorizedException();

    // Verify the raw token matches the stored hash
    const valid = await bcrypt.compare(rawRefreshToken, storedHash);
    if (!valid) throw new UnauthorizedException();

    const user = await this.users.findById(decoded.sub);
    if (!user) throw new UnauthorizedException();

    const payload: JwtPayloadVo = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload);
    // Rotate refresh token on every use
    const newRefreshToken = this.jwt.sign(payload, { expiresIn: '7d' });
    const newHash = await bcrypt.hash(newRefreshToken, 10);
    await this.users.updateRefreshToken(user.id, newHash);

    return { accessToken, refreshToken: newRefreshToken };
  }
}
