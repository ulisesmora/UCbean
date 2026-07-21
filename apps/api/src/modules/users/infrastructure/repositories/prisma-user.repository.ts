import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/value-objects/role.enum';

type PrismaUser = {
  id: string; email: string; name: string;
  role: string; phone: string | null;
  passwordHash: string; createdAt: Date;
};

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const r = await this.prisma.user.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const r = await this.prisma.user.findUnique({ where: { email } });
    if (!r) return null;
    return { ...this.toDomain(r), passwordHash: r.passwordHash };
  }

  async findRefreshTokenHash(userId: string): Promise<string | null> {
    const r = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { refreshToken: true },
    });
    return r?.refreshToken ?? null;
  }

  async create(data: { email: string; name: string; passwordHash: string; phone?: string }): Promise<User> {
    const r = await this.prisma.user.create({ data });
    return this.toDomain(r);
  }

  async updateRefreshToken(userId: string, tokenHash: string | null): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: tokenHash } });
  }

  async update(userId: string, data: Partial<{ name: string; phone: string }>): Promise<User> {
    const r = await this.prisma.user.update({ where: { id: userId }, data });
    return this.toDomain(r);
  }

  async save(entity: User): Promise<User> {
    return this.update(entity.id, { name: entity.name, phone: entity.phone ?? undefined });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private toDomain(r: PrismaUser): User {
    return new User(r.id, r.email, r.name, r.role as Role, r.phone, r.createdAt);
  }
}
