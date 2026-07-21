import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { IUserRepository, USER_REPOSITORY } from '../../../users/domain/repositories/user.repository.interface';
import { JwtPayloadVo } from '../../domain/value-objects/jwt-payload.vo';

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
  phone?: string;
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly jwt: JwtService,
  ) {}

  async execute(input: RegisterInput) {
    const exists = await this.users.findByEmail(input.email);
    if (exists) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.users.create({
      email: input.email,
      name: input.name,
      passwordHash,
      phone: input.phone,
    });

    const payload: JwtPayloadVo = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, { expiresIn: '7d' });
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.users.updateRefreshToken(user.id, refreshHash);

    return { accessToken, refreshToken, user };
  }
}
