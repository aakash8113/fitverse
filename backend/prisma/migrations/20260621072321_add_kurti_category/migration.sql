/*
  Warnings:

  - You are about to drop the column `phonePeOrderId` on the `ai_credit_purchases` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "ClothingCategory" ADD VALUE 'KURTI';

-- AlterTable
ALTER TABLE "ai_credit_purchases" DROP COLUMN "phonePeOrderId",
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;
