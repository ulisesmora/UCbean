-- Every recipe is sold as a product. The link lives on the recipe; the
-- product row is created and kept in sync by the recipes service on save and
-- on boot. Deleting the product only unlinks the recipe.

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "productId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_productId_key" ON "Recipe"("productId");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
