import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Lo que devuelve el botón de Google en el navegador. */
export class GoogleTokenDto {
  @ApiProperty({
    description: 'The `credential` from Google Identity Services: a JWT signed by Google.',
  })
  @IsString()
  // Un JWT de Google ronda los 900 caracteres. Los topes evitan que alguien
  // use este campo para mandar un megabyte de basura al validador.
  @MinLength(50)
  @MaxLength(4096)
  credential: string;
}
