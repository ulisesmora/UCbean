import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'ana@ucbean.ca' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePass123' })
  @IsString()
  password: string;
}
