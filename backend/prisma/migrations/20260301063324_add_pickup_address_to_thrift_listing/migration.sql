-- AlterTable
ALTER TABLE "thrift_listings" ADD COLUMN     "pickupAddressId" TEXT;

-- AddForeignKey
ALTER TABLE "thrift_listings" ADD CONSTRAINT "thrift_listings_pickupAddressId_fkey" FOREIGN KEY ("pickupAddressId") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
