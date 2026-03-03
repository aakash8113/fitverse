-- AlterEnum
ALTER TYPE "ThriftListingStatus" ADD VALUE 'OFFER_SENT';

-- AlterTable
ALTER TABLE "thrift_listings" ADD COLUMN     "contactRequested" BOOLEAN NOT NULL DEFAULT false;
