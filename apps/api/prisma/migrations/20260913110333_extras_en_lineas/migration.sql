-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "extras" TEXT[] DEFAULT ARRAY[]::TEXT[];
