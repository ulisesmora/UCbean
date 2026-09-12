import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { RecipesService } from '../../application/use-cases/recipes.service';
import { CreateRecipeDto, UpdateRecipeDto } from '../dtos/recipes.dto';

/** Fechas del cuerpo a fechas de verdad, en un solo sitio. */
function withDates(dto: CreateRecipeDto | UpdateRecipeDto) {
  return {
    ...dto,
    activeFrom: dto.activeFrom ? new Date(dto.activeFrom) : null,
    activeTo: dto.activeTo ? new Date(dto.activeTo) : null,
  };
}

@ApiTags('Recipes')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipes: RecipesService) {}

  @Get()
  @ApiOperation({ summary: 'Lo que servimos hoy, con su precio y su ticket' })
  @ApiQuery({ name: 'kind', required: false, enum: ['SIGNATURE', 'SEASONAL'] })
  current(@Query('kind') kind?: 'SIGNATURE' | 'SEASONAL') {
    return this.recipes.current(kind);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Todas, incluidas las apagadas y fuera de temporada' })
  all() {
    return this.recipes.all();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Una receta por su slug' })
  bySlug(@Param('slug') slug: string) {
    return this.recipes.bySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una receta (solo OWNER)' })
  create(@Body() dto: CreateRecipeDto) {
    return this.recipes.create(withDates(dto));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar una receta (solo OWNER)' })
  update(@Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    return this.recipes.update(id, withDates(dto));
  }
}
