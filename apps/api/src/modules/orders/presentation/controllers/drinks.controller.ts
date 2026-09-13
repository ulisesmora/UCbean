import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { DrinkPricesService } from '../../application/use-cases/drink-prices.service';
import { SetPriceDto } from '../dtos/set-price.dto';
import { DRINK_CATALOGUE } from '../../domain/value-objects/drink-catalogue';
import {
  canPourArt,
  describeBuild,
  hasFoam,
  priceOfBuild,
} from '../../domain/value-objects/drink-price';
import { DrinkBuildDto } from '../dtos/create-order.dto';

/**
 * The coffee creator, as the server sees it.
 *
 * Open without a token: it is the menu. A customer has to be able to see what
 * a drink would cost before deciding to sign in and order one.
 */
@ApiTags('Drinks')
@Controller('drinks')
export class DrinksController {
  constructor(private readonly priceBook: DrinkPricesService) {}

  @Get('options')
  @ApiOperation({
    summary: 'Every choice that can go into a drink, with its price',
    description:
      'Beans, sizes, bases, serve styles, milks, foams, latte art, extras, vessels and ' +
      'sleeves. The configurator builds its steps from this, so adding an option here ' +
      'puts it on the menu without a frontend release.',
  })
  options() {
    return DRINK_CATALOGUE;
  }

  @Post('price')
  @ApiOperation({
    summary: 'Price and describe a build without ordering it',
    description:
      'The same sum the order endpoint charges. Use it to show a running total, so the ' +
      'figure on screen is the one that will be billed.',
  })
  price(@Body() build: DrinkBuildDto) {
    return {
      price: priceOfBuild(build),
      ticket: describeBuild(build),
      // What the configurator should show: no foam picker on an iced drink, no
      // art picker on foam you cannot pour through.
      takesFoam: hasFoam(build),
      takesArt: canPourArt(build),
    };
  }

  @Get('prices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'What each part of a drink costs, with its default',
    description: 'For the prices screen in the counter app.',
  })
  prices() {
    return this.priceBook.list();
  }

  @Patch('prices/:group/:optionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Set or reset the price of one part (OWNER only)',
    description:
      'Takes effect at once for the builder, orders and every recipe without a fixed price. ' +
      'Send price: null to go back to the default.',
  })
  setPrice(
    @Param('group') group: string,
    @Param('optionId') optionId: string,
    @Body() body: SetPriceDto,
  ) {
    return this.priceBook.update(group, optionId, body.price ?? null);
  }
}
