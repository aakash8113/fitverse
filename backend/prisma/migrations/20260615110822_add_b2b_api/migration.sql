-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'BUSINESS';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "businessCredits" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "business_api_keys" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_credit_purchases" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amountInPaise" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_credit_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_api_keys_keyHash_key" ON "business_api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "business_api_keys_businessId_idx" ON "business_api_keys"("businessId");

-- CreateIndex
CREATE INDEX "business_api_keys_keyHash_idx" ON "business_api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "business_credit_purchases_businessId_idx" ON "business_credit_purchases"("businessId");

-- AddForeignKey
ALTER TABLE "business_api_keys" ADD CONSTRAINT "business_api_keys_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_credit_purchases" ADD CONSTRAINT "business_credit_purchases_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
