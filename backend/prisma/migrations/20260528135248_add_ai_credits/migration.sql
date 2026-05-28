-- CreateEnum
CREATE TYPE "AiCreditPurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "aiCredits" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "aiTryOnCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "hdMode" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_credit_purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amountInPaise" INTEGER NOT NULL,
    "status" "AiCreditPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "phonePeOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_credit_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_usage_taskId_key" ON "ai_usage"("taskId");

-- CreateIndex
CREATE INDEX "ai_usage_userId_idx" ON "ai_usage"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_success_idx" ON "ai_usage"("success");

-- CreateIndex
CREATE INDEX "ai_credit_purchases_userId_idx" ON "ai_credit_purchases"("userId");

-- CreateIndex
CREATE INDEX "ai_credit_purchases_status_idx" ON "ai_credit_purchases"("status");

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_credit_purchases" ADD CONSTRAINT "ai_credit_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
