import { Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../users/domain/repositories/user.repository.interface';

@Injectable()
export class LogoutUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: IUserRepository) {}

  async execute(userId: string): Promise<void> {
    await this.users.updateRefreshToken(userId, null);
  }
}
