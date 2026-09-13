-- Uploaded photos kept in the database, so they survive redeploys and are
-- served the same way whatever disk the API is running on.

-- CreateTable
CREATE TABLE "StoredImage" (
    "path" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredImage_pkey" PRIMARY KEY ("path")
);
