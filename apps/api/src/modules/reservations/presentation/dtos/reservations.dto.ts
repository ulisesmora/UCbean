import { IsDateString, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TableReservationDto {
  @ApiProperty({ example: 2, minimum: 1, maximum: 16 })
  @IsInt()
  @Min(1)
  @Max(16)
  @Type(() => Number)
  partySize: number;

  @ApiProperty({ example: '2026-09-01T12:00:00.000Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ example: 'Window seat preferred', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
