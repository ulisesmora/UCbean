/**
 * Whether a recipe is on sale right now: switched on, and inside its dates
 * when it has them. A seasonal drink scheduled for October is not sold in
 * August, even though its product row already exists.
 */
export function isRecipeLive(
  recipe: { isActive: boolean; activeFrom: Date | null; activeTo: Date | null },
  now: Date = new Date(),
): boolean {
  if (!recipe.isActive) return false;
  if (recipe.activeFrom && recipe.activeFrom.getTime() > now.getTime()) return false;
  if (recipe.activeTo && recipe.activeTo.getTime() < now.getTime()) return false;
  return true;
}
