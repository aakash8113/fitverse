-- AlterTable: add thriftCondition to products (nullable, only set for thrift products)
ALTER TABLE "products" ADD COLUMN "thriftCondition" TEXT;
