-- Prices set from the counter app: one row per drink component that differs
-- from its default, and an optional fixed price per recipe.

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "priceOverride" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "DrinkOptionPrice" (
    "group" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrinkOptionPrice_pkey" PRIMARY KEY ("group","optionId")
);
