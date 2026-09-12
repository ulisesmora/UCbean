import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcryptjs';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../users/domain/repositories/user.repository.interface';
import { JwtPayloadVo } from '../../domain/value-objects/jwt-payload.vo';
import { EVENTS, type UserRegisteredEvent } from '../../../../common/events/domain-events';

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
    private readonly events: EventEmitter2,
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

    // Se anuncia al final, con la cuenta ya escrita: los puntos de
    // bienvenida y el cupón del primer pedido cuelgan de aquí, y regalar
    // ambos por un alta que falló es peor que no regalar nada.
    this.events.emit(EVENTS.userRegistered, {
      userId: user.id,
      email: user.email,
      name: user.name,
    } satisfies UserRegisteredEvent);

    return { accessToken, refreshToken, user };
  }
}
