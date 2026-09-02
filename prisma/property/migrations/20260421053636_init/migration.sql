/*
  Warnings:

  - Added the required column `zone_id` to the `tbl_collection_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zone_id` to the `tbl_property_advance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ulb_id` to the `tbl_property_demand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ward_id` to the `tbl_property_demand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zone_id` to the `tbl_property_demand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zone_id` to the `tbl_transaction_master` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_collection_details" ADD COLUMN     "zone_id" INTEGER;

-- AlterTable
ALTER TABLE "tbl_property_advance" ADD COLUMN     "zone_id" INTEGER;

-- AlterTable
ALTER TABLE "tbl_property_demand" ADD COLUMN     "ulb_id" INTEGER,
ADD COLUMN     "ward_id" INTEGER,
ADD COLUMN     "zone_id" INTEGER;

-- AlterTable
ALTER TABLE "tbl_transaction_master" ADD COLUMN     "zone_id" INTEGER;
