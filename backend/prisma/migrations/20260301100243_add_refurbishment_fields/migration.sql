-- AlterEnum
ALTER TYPE "ThriftItemStatus" ADD VALUE 'REFURBISHMENT_COMPLETE';

-- AlterTable
ALTER TABLE "thrift_items" ADD COLUMN     "refurbishmentCost" DECIMAL(10,2);
