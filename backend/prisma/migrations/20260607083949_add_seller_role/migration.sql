-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SELLER';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shippedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "sellerId" TEXT;

-- CreateIndex
CREATE INDEX "products_sellerId_idx" ON "products"("sellerId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
