-- CreateTable
CREATE TABLE "FavoriteDrink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "build" JSONB NOT NULL,
    "recipeId" TEXT,
    "productId" TEXT,
    "timesOrdered" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FavoriteDrink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FavoriteDrink_userId_timesOrdered_idx" ON "FavoriteDrink"("userId", "timesOrdered");

-- AddForeignKey
ALTER TABLE "FavoriteDrink" ADD CONSTRAINT "FavoriteDrink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
