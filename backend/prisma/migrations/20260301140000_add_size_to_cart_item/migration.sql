-- Add size column to cart_items with empty string default
ALTER TABLE "cart_items" ADD COLUMN "size" TEXT NOT NULL DEFAULT '';

-- Drop old unique constraint (cartId + productId)
DROP INDEX IF EXISTS "cart_items_cartId_productId_key";

-- Create new unique constraint (cartId + productId + size)
CREATE UNIQUE INDEX "cart_items_cartId_productId_size_key" ON "cart_items"("cartId", "productId", "size");
