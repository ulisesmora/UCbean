import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Regreso a clases' })
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiProperty({ enum: ['EMAIL', 'SMS'], default: 'EMAIL' })
  @IsIn(['EMAIL', 'SMS'])
  channel: 'EMAIL' | 'SMS';

  @ApiProperty({
    enum: ['ALL', 'WITH_POINTS', 'BIRTHDAY_MONTH', 'INACTIVE'],
    description:
      'ALL escribe a todo el que aceptó publicidad. WITH_POINTS solo a quien tiene saldo. ' +
      'BIRTHDAY_MONTH a los que cumplen este mes. INACTIVE a quien no pide desde hace 60 dias.',
  })
  @IsIn(['ALL', 'WITH_POINTS', 'BIRTHDAY_MONTH', 'INACTIVE'])
  audience: 'ALL' | 'WITH_POINTS' | 'BIRTHDAY_MONTH' | 'INACTIVE';

  @ApiPropertyOptional({ example: 'Vuelve por tu café de siempre' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  subject?: string;

  @ApiProperty({
    example: 'Hola {{nombre}}, llevas {{puntos}} puntos. Pásate esta semana.',
    description: 'Admite {{nombre}} y {{puntos}}, que se sustituyen por persona.',
  })
  @IsString()
  @MaxLength(4000)
  body: string;

  @ApiPropertyOptional({ description: 'Cuando dejarla programada. Vacio la deja en borrador.' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
