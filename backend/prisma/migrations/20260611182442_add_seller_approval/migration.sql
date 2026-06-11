-- CreateEnum
CREATE TYPE "SellerApprovalStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'PRICE_UPDATE_REQUESTED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "sellerApprovalStatus" "SellerApprovalStatus",
ADD COLUMN     "sellerPrice" DECIMAL(10,2);
