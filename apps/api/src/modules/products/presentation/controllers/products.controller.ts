import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { CreateProductDto, UpdateProductDto } from '../dtos/create-product.dto';
import { ProductMapper, CategoryMapper } from '../../infrastructure/mappers/product.mapper';
import { PrismaService } from '../../../../prisma/prisma.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly listCategories: ListCategoriesUseCase,
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all available products, optionally filtered by category' })
  @ApiQuery({ name: 'categoryId', required: false })
  async getAll(@Query('categoryId') categoryId?: string) {
    const products = await this.listProducts.execute(categoryId);
    return ProductMapper.toResponseList(products);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a category (OWNER only)',
    description: 'Needed to sell pastries or food without editing the database by hand.',
  })
  async createCategory(@Body() body: { name: string }) {
    const name = body?.name?.trim();
    if (!name) throw new BadRequestException('The category needs a name');

    const existe = await this.prisma.category.findUnique({ where: { name } });
    if (existe) throw new ConflictException('A category with that name already exists');

    return this.prisma.category.create({ data: { name } });
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rename a category (OWNER only)' })
  async renameCategory(@Param('id') id: string, @Body() body: { name: string }) {
    const name = body?.name?.trim();
    if (!name) throw new BadRequestException('The category needs a name');
    return this.prisma.category.update({ where: { id }, data: { name } });
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an empty category (OWNER only)' })
  async removeCategory(@Param('id') id: string) {
    // Borrarla con productos dentro los dejaría huérfanos y Prisma lo
    // impediría igual, pero con un error de clave foránea que nadie lee.
    const cuantos = await this.prisma.product.count({ where: { categoryId: id } });
    if (cuantos > 0) {
      throw new BadRequestException(
        `That category has ${cuantos} products. Move them before deleting it.`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all menu categories' })
  async getCategories() {
    const categories = await this.listCategories.execute();
    return CategoryMapper.toResponseList(categories);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product (OWNER / STAFF only)' })
  async create(@Body() dto: CreateProductDto) {
    const product = await this.createProduct.execute(dto);
    return ProductMapper.toResponse(product);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (OWNER / STAFF only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const product = await this.updateProduct.execute(id, dto);
    return ProductMapper.toResponse(product);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.updateProduct.execute(id, { isAvailable: false });
  }
}
