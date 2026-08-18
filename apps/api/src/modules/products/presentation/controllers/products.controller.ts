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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { CreateProductDto, UpdateProductDto } from '../dtos/create-product.dto';
import { ProductMapper, CategoryMapper } from '../../infrastructure/mappers/product.mapper';
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
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all available products, optionally filtered by category' })
  @ApiQuery({ name: 'categoryId', required: false })
  async getAll(@Query('categoryId') categoryId?: string) {
    const products = await this.listProducts.execute(categoryId);
    return ProductMapper.toResponseList(products);
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
