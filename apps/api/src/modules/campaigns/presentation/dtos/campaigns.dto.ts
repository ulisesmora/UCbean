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
      'ALL writes to everyone who accepted marketing. WITH_POINTS only to people with a balance. ' +
      'BIRTHDAY_MONTH to birthdays this month. INACTIVE to people with no order in 60 days.',
  })
  @IsIn(['ALL', 'WITH_POINTS', 'BIRTHDAY_MONTH', 'INACTIVE'])
  audience: 'ALL' | 'WITH_POINTS' | 'BIRTHDAY_MONTH' | 'INACTIVE';

  @ApiPropertyOptional({ example: 'Come back for your usual coffee' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  subject?: string;

  @ApiProperty({
    example: 'Hi {{name}}, you have {{points}} points. Drop by this week.',
    description: 'Supports {{name}} and {{points}}, filled in per person.',
  })
  @IsString()
  @MaxLength(4000)
  body: string;

  @ApiPropertyOptional({ description: 'Cuando dejarla programada. Vacio la deja en borrador.' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
