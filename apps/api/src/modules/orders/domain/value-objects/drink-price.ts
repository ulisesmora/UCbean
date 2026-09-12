import type { DrinkBuild } from './drink-build';
import {
  ARTS,
  BASES,
  BEANS,
  EXTRAS,
  FOAMS,
  MILKS,
  SERVES,
  SIZES,
  VESSELS,
  optionById,
  type DrinkOption,
} from './drink-catalogue';

/**
 * What a built drink costs.
 *
 * Summed from the catalogue, so a price only ever moves in one place. The
 * configurator computes the same total to show the customer a figure before
 * they commit, but that number is never trusted: this is the one billed.
 */

/** Steamed milk only happens on a hot drink that takes milk at all. */
export function hasFoam(build: DrinkBuild): boolean {
  const base = optionById(BASES, build.base);
  return build.serve === 'hot' && build.milk !== 'none' && (base?.foam ?? 0) > 0.3;
}

/**
 * Art needs foam you can pour through. Dry cappuccino foam is too stiff to
 * take a pattern, which is true at the machine as well as here.
 */
export function canPourArt(build: DrinkBuild): boolean {
  return hasFoam(build) && (optionById(FOAMS, build.foam)?.pourable ?? false);
}

/**
 * Unknown ids cost nothing rather than throwing.
 *
 * The shape was already validated at the edge, so an id we do not recognise
 * means the menu moved on since the drink was configured. Charging nothing for
 * that part is the answer that never overcharges a customer for our own
 * bookkeeping.
 */
const priceOf = (list: DrinkOption[], id: string) => optionById(list, id)?.price ?? 0;

export function priceOfBuild(build: DrinkBuild): number {
  const total =
    priceOf(BEANS, build.beans) +
    priceOf(SIZES, build.size) +
    priceOf(BASES, build.base) +
    priceOf(SERVES, build.serve) +
    priceOf(MILKS, build.milk) +
    (hasFoam(build) ? priceOf(FOAMS, build.foam) : 0) +
    (canPourArt(build) ? priceOf(ARTS, build.art) : 0) +
    priceOf(VESSELS, build.vessel) +
    build.extras.reduce((sum, e) => sum + priceOf(EXTRAS, e), 0);

  // Money, to the cent. Adding 0.75 and 0.3 in binary floating point does not
  // land on a clean number, and this figure goes into a Decimal(10,2) column.
  return Math.round(total * 100) / 100;
}

/** The ticket line, in the words the barista reads off the printer. */
export function describeBuild(build: DrinkBuild): string {
  const size = optionById(SIZES, build.size);
  const parts = [
    size?.volume ?? build.size,
    optionById(SERVES, build.serve)?.name ?? build.serve,
    optionById(BASES, build.base)?.name ?? build.base,
    optionById(BEANS, build.beans)?.name ?? build.beans,
  ];

  if (build.milk !== 'none') {
    parts.push(`${(optionById(MILKS, build.milk)?.name ?? build.milk).toLowerCase()} milk`);
  }
  if (hasFoam(build)) {
    parts.push((optionById(FOAMS, build.foam)?.name ?? build.foam).toLowerCase());
  }
  if (canPourArt(build) && build.art !== 'none') {
    parts.push(`${(optionById(ARTS, build.art)?.name ?? build.art).toLowerCase()} poured`);
  }
  for (const id of build.extras) {
    parts.push((optionById(EXTRAS, id)?.name ?? id).toLowerCase());
  }
  parts.push((optionById(VESSELS, build.vessel)?.name ?? build.vessel).toLowerCase());

  return parts.join(' · ');
}
