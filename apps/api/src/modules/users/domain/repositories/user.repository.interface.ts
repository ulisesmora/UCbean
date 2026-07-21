import { IBaseRepository } from '../../../../common/base/base-repository.interface';
import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('IUserRepository');

export interface IUserRepository extends IBaseRepository<User> {
  findByEmail(email: string): Promise<(User & { passwordHash: string }) | null>;
  findRefreshTokenHash(userId: string): Promise<string | null>;
  create(data: { email: string; name: string; passwordHash: string; phone?: string }): Promise<User>;
  updateRefreshToken(userId: string, tokenHash: string | null): Promise<void>;
  update(userId: string, data: Partial<{ name: string; phone: string }>): Promise<User>;
}
