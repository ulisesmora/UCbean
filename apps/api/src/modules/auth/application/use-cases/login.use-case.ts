import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { IUserRepository, USER_REPOSITORY } from '../../../users/domain/repositories/user.repository.interface';
import { JwtPayloadVo } from '../../domain/value-objects/jwt-payload.vo';

export interface LoginInput {
  email: string;
  password: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly jwt: JwtService,
  ) {}

  async execute(input: LoginInput) {
    const record = await this.users.findByEmail(input.email);
    if (!record) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(input.password, record.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload: JwtPayloadVo = { sub: record.id, email: record.email, role: record.role };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, { expiresIn: '7d' });
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.users.updateRefreshToken(record.id, refreshHash);

    return { accessToken, refreshToken, user: record };
  }
}
