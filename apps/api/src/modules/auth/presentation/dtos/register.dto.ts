import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'ana@ucbean.ca' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ana Morales' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'securePass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '+1-604-555-0100', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
