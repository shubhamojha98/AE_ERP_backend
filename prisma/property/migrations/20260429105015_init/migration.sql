/*
  Warnings:

  - Made the column `zone_id` on table `tbl_collection_details` required. This step will fail if there are existing NULL values in that column.
  - Made the column `zone_id` on table `tbl_property_advance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `zone_id` on table `tbl_transaction_master` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tbl_collection_details" ALTER COLUMN "zone_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "tbl_property_advance" ALTER COLUMN "zone_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "tbl_transaction_master" ALTER COLUMN "zone_id" SET NOT NULL;
