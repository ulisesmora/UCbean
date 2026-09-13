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
  @ApiOperation({ summary: 'What we serve today, with price and ticket' })
  @ApiQuery({ name: 'kind', required: false, enum: ['SIGNATURE', 'SEASONAL'] })
  current(@Query('kind') kind?: 'SIGNATURE' | 'SEASONAL') {
    return this.recipes.current(kind);
  }

  @Get('best-sellers')
  @ApiOperation({
    summary: 'Most ordered over recent weeks',
    description: 'Counted from real orders. Empty if nothing has sold yet.',
  })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  @ApiQuery({ name: 'limit', required: false, example: 6 })
  bestSellers(@Query('days') days?: string, @Query('limit') limit?: string) {
    // Los topes evitan que una url a mano pida el histórico entero.
    const ventana = Math.min(Math.max(Number(days) || 30, 1), 365);
    const cuantas = Math.min(Math.max(Number(limit) || 6, 1), 24);
    return this.recipes.bestSellers(ventana, cuantas);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'All of them, including switched off and out of season' })
  all() {
    return this.recipes.all();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'One recipe by its slug' })
  bySlug(@Param('slug') slug: string) {
    return this.recipes.bySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a recipe (OWNER only)' })
  create(@Body() dto: CreateRecipeDto) {
    return this.recipes.create(withDates(dto));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit a recipe (OWNER only)' })
  update(@Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    return this.recipes.update(id, withDates(dto));
  }
}
