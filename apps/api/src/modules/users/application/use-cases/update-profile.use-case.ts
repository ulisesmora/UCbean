import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class UpdateProfileUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: IUserRepository) {}

  async execute(userId: string, data: { name?: string; phone?: string }) {
    const exists = await this.users.findById(userId);
    if (!exists) throw new NotFoundException('User not found');
    return this.users.update(userId, data);
  }
}
