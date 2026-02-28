-- CreateEnum
CREATE TYPE "ThriftListingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PICKED_UP', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ThriftItemStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PICKED_UP', 'UNDER_REFURBISHMENT', 'LISTED', 'SOLD');

-- CreateEnum
CREATE TYPE "ThriftItemCondition" AS ENUM ('POOR', 'FAIR', 'GOOD', 'VERY_GOOD', 'LIKE_NEW');

-- CreateEnum
CREATE TYPE "ThriftItemCategory" AS ENUM ('TOPS', 'BOTTOMS', 'DRESSES', 'OUTERWEAR', 'FOOTWEAR', 'ACCESSORIES', 'SPORTSWEAR', 'ETHNIC', 'BAGS', 'OTHER');

-- CreateTable
CREATE TABLE "thrift_listings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ThriftListingStatus" NOT NULL DEFAULT 'PENDING',
    "pickupDate" TIMESTAMP(3),
    "pickupSlot" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "thrift_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thrift_items" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" "ThriftItemCategory" NOT NULL,
    "size" TEXT,
    "condition" "ThriftItemCondition" NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "originalPrice" DECIMAL(10,2),
    "estimatedValue" DECIMAL(10,2),
    "listedPrice" DECIMAL(10,2),
    "status" "ThriftItemStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "listedProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "thrift_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "thrift_listings_userId_idx" ON "thrift_listings"("userId");

-- CreateIndex
CREATE INDEX "thrift_listings_status_idx" ON "thrift_listings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "thrift_items_listedProductId_key" ON "thrift_items"("listedProductId");

-- CreateIndex
CREATE INDEX "thrift_items_listingId_idx" ON "thrift_items"("listingId");

-- CreateIndex
CREATE INDEX "thrift_items_userId_idx" ON "thrift_items"("userId");

-- CreateIndex
CREATE INDEX "thrift_items_status_idx" ON "thrift_items"("status");

-- AddForeignKey
ALTER TABLE "thrift_listings" ADD CONSTRAINT "thrift_listings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thrift_items" ADD CONSTRAINT "thrift_items_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "thrift_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thrift_items" ADD CONSTRAINT "thrift_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
