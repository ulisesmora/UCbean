import { Role } from '../value-objects/role.enum';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: Role,
    public readonly phone: string | null,
    public readonly createdAt: Date,
  ) {}
}
