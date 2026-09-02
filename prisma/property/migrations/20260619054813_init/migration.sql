-- AlterTable
ALTER TABLE "tbl_property_owner" ADD COLUMN     "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "effective_to" TIMESTAMP(3),
ADD COLUMN     "is_current" BOOLEAN NOT NULL DEFAULT true;
