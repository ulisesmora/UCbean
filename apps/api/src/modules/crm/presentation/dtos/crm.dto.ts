import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStaffDto {
  @ApiProperty({ example: 'Marta Ruiz' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'marta@aroundthebean.ca' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'UnaClaveLarga!2026', minLength: 10 })
  @IsString()
  // Diez y no ocho: esta cuenta abre la caja y la lista de clientes,
  // así que no puede protegerse peor que la de quien pide un café.
  @MinLength(10)
  @MaxLength(72)
  password: string;

  @ApiProperty({ enum: ['OWNER', 'STAFF'], default: 'STAFF' })
  @IsIn(['OWNER', 'STAFF'])
  role: 'OWNER' | 'STAFF';
}

export class SetRoleDto {
  @ApiProperty({ enum: ['OWNER', 'STAFF', 'CUSTOMER'] })
  @IsIn(['OWNER', 'STAFF', 'CUSTOMER'])
  role: 'OWNER' | 'STAFF' | 'CUSTOMER';
}
