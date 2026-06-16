-- CreateEnum
CREATE TYPE "ShippingMethod" AS ENUM ('ADMIN', 'SHIPROCKET');

-- AlterTable
ALTER TABLE "addresses" ALTER COLUMN "country" SET DEFAULT 'India';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "awbCode" TEXT,
ADD COLUMN     "courierId" TEXT,
ADD COLUMN     "courierName" TEXT,
ADD COLUMN     "labelUrl" TEXT,
ADD COLUMN     "manifestUrl" TEXT,
ADD COLUMN     "pickupScheduledAt" TIMESTAMP(3),
ADD COLUMN     "shipmentId" TEXT,
ADD COLUMN     "shippingMethod" "ShippingMethod",
ADD COLUMN     "shiprocketOrderId" TEXT,
ADD COLUMN     "trackingUrl" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "breadth" DECIMAL(5,1),
ADD COLUMN     "height" DECIMAL(5,1),
ADD COLUMN     "length" DECIMAL(5,1),
ADD COLUMN     "weight" DECIMAL(6,2);

-- CreateTable
CREATE TABLE "pickup_addresses" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "address" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "shiprocketCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "address" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "shiprocketCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pickup_addresses_sellerId_idx" ON "pickup_addresses"("sellerId");

-- CreateIndex
CREATE INDEX "orders_shippingMethod_idx" ON "orders"("shippingMethod");

-- AddForeignKey
ALTER TABLE "pickup_addresses" ADD CONSTRAINT "pickup_addresses_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
