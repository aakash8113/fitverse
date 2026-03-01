/*
  Warnings:

  - Added the required column `gender` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wearType` to the `products` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `category` on the `products` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `gender` to the `thrift_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wearType` to the `thrift_items` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `category` on the `thrift_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MENS', 'WOMENS');

-- CreateEnum
CREATE TYPE "WearType" AS ENUM ('TOPWEAR', 'BOTTOMWEAR');

-- CreateEnum
CREATE TYPE "ClothingCategory" AS ENUM ('TSHIRT', 'SHIRT', 'HOODIE', 'JACKET', 'JEANS', 'TROUSER', 'TRACKPANT', 'CARGO');

-- CreateEnum
CREATE TYPE "ClothingSubCategory" AS ENUM ('OVERSIZED', 'POLO', 'DROP_SHOULDER', 'V_NECK', 'SHORT_SLEEVED', 'LONG_SLEEVED', 'PRINTED', 'PLAIN', 'TEXTURED', 'DENIM', 'SKINNY', 'BAGGY', 'BOOT_CUT');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "availableSizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "isThrift" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subCategory" "ClothingSubCategory",
ADD COLUMN     "wearType" "WearType" NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" "ClothingCategory" NOT NULL;

-- AlterTable
ALTER TABLE "thrift_items" ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "subCategory" "ClothingSubCategory",
ADD COLUMN     "wearType" "WearType" NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" "ClothingCategory" NOT NULL;

-- DropEnum
DROP TYPE "ProductCategory";

-- DropEnum
DROP TYPE "ThriftItemCategory";

-- CreateIndex
CREATE INDEX "products_gender_idx" ON "products"("gender");

-- CreateIndex
CREATE INDEX "products_wearType_idx" ON "products"("wearType");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_isThrift_idx" ON "products"("isThrift");
