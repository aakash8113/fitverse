-- Create enum for carousel placement
CREATE TYPE "CarouselPlacement" AS ENUM ('HOME', 'SHOP');

-- Create table for runtime-managed carousel slides
CREATE TABLE "carousel_slides" (
    "id" TEXT NOT NULL,
    "placement" "CarouselPlacement" NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carousel_slides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "carousel_slides_placement_sortOrder_key" ON "carousel_slides"("placement", "sortOrder");
CREATE INDEX "carousel_slides_placement_isActive_idx" ON "carousel_slides"("placement", "isActive");
