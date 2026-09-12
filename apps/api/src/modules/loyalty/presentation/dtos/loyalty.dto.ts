import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRewardDto {
  @ApiProperty({ example: 'Café gratis' })
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'Cualquier bebida de tamaño mediano' })
  @IsString()
  @MaxLength(240)
  description: string;

  @ApiProperty({ example: 120, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  cost: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}

export class GrantPointsDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 25, description: 'Negativo para quitar puntos' })
  @IsInt()
  @Type(() => Number)
  delta: number;

  @ApiProperty({ example: 'Disculpa por la espera del martes' })
  @IsString()
  @MaxLength(200)
  note: string;
}
