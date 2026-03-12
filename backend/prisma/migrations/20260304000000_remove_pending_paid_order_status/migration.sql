-- Migration: Remove PENDING and PAID from OrderStatus enum
-- All PENDING and PAID orders become PROCESSING

-- Step 1: Migrate existing PENDING/PAID orders to PROCESSING
UPDATE "orders" SET "status" = 'PROCESSING' WHERE "status" IN ('PENDING', 'PAID');

-- Step 2: Create a new enum without PENDING and PAID
CREATE TYPE "OrderStatus_new" AS ENUM ('PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- Step 3: Drop the default so we can change the column type
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;

-- Step 4: Alter the orders table to use the new enum
ALTER TABLE "orders"
  ALTER COLUMN "status" TYPE "OrderStatus_new"
  USING ("status"::text::"OrderStatus_new");

-- Step 5: Set new default using the new enum type
ALTER TABLE "orders"
  ALTER COLUMN "status" SET DEFAULT 'PROCESSING'::"OrderStatus_new";

-- Step 6: Drop old enum and rename new one
DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
