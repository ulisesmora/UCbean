import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
}
