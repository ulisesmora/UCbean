import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class SetPriceDto {
  @ApiPropertyOptional({
    example: 0.85,
    nullable: true,
    description:
      'New price in dollars. null resets it to the default. Can be negative, as a discount.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(-50)
  @Max(500)
  price?: number | null;
}
