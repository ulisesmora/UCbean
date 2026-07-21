import { Role } from '../../../users/domain/value-objects/role.enum';

export interface JwtPayloadVo {
  sub: string;
  email: string;
  role: Role;
}
