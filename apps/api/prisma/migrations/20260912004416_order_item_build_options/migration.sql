-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "nameSnapshot" TEXT,
ADD COLUMN     "options" JSONB,
ADD COLUMN     "recipeId" TEXT,
ADD COLUMN     "ticketSnapshot" TEXT;
