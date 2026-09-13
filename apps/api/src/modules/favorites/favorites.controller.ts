import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayloadVo } from '../auth/domain/value-objects/jwt-payload.vo';
import { PrismaService } from '../../prisma/prisma.service';
import { priceOfBuild, describeBuild } from '../orders/domain/value-objects/drink-price';
import type { DrinkBuild } from '../orders/domain/value-objects/drink-build';

export class SaveFavoriteDto {
  @ApiProperty({ example: 'My morning latte' })
  @IsString()
  @MaxLength(60)
  name: string;

  @ApiProperty({ description: 'The formula, same as the builder' })
  @IsObject()
  build: DrinkBuild;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  recipeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;
}

/**
 * «Lo de siempre».
 *
 * Una bebida guardada con el nombre que le dio quien la pide. Volver a
 * pedirla es copiar la formula al carrito, no rehacer diez pasos del
 * configurador, que es la friccion que hace que la gente acabe pidiendo
 * el latte de la carta en vez del suyo.
 *
 * El precio y el ticket se calculan al leer, con las mismas reglas que
 * cobra la caja: una favorita guardada hace meses no puede ensenar un
 * precio viejo.
 */
@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'My saved drinks, most ordered first' })
  async mine(@CurrentUser() user: JwtPayloadVo) {
    const rows = await this.prisma.favoriteDrink.findMany({
      where: { userId: user.sub },
      orderBy: [{ timesOrdered: 'desc' }, { createdAt: 'desc' }],
    });

    return rows.map((f) => {
      const build = f.build as unknown as DrinkBuild;
      return { ...f, price: priceOfBuild(build), ticket: describeBuild(build) };
    });
  }

  @Post()
  @ApiOperation({ summary: 'Save a drink' })
  async save(@CurrentUser() user: JwtPayloadVo, @Body() dto: SaveFavoriteDto) {
    const row = await this.prisma.favoriteDrink.create({
      data: {
        userId: user.sub,
        name: dto.name.trim(),
        build: dto.build as never,
        recipeId: dto.recipeId,
        productId: dto.productId,
      },
    });
    const build = row.build as unknown as DrinkBuild;
    return { ...row, price: priceOfBuild(build), ticket: describeBuild(build) };
  }

  @Post(':id/ordered')
  @ApiOperation({
    summary: 'Record that it was ordered again',
    description: 'Bumps the counter that sorts the list, no dragging needed.',
  })
  async markOrdered(@CurrentUser() user: JwtPayloadVo, @Param('id') id: string) {
    // El userId va en el where: sin el, cualquiera podria subir el
    // contador de la favorita de otra persona.
    await this.prisma.favoriteDrink.updateMany({
      where: { id, userId: user.sub },
      data: { timesOrdered: { increment: 1 } },
    });
    return { ok: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Forget a saved drink' })
  async remove(@CurrentUser() user: JwtPayloadVo, @Param('id') id: string) {
    await this.prisma.favoriteDrink.deleteMany({ where: { id, userId: user.sub } });
    return { ok: true };
  }
}
