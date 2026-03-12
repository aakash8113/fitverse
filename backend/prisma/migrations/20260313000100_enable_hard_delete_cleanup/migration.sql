ALTER TABLE "order_items"
ALTER COLUMN "productId" DROP NOT NULL;

ALTER TABLE "order_items"
DROP CONSTRAINT IF EXISTS "order_items_productId_fkey";

ALTER TABLE "order_items"
ADD CONSTRAINT "order_items_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "thrift_items"
DROP CONSTRAINT IF EXISTS "thrift_items_listedProductId_fkey";

ALTER TABLE "thrift_items"
ADD CONSTRAINT "thrift_items_listedProductId_fkey"
FOREIGN KEY ("listedProductId") REFERENCES "products"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;