-- AlterTable
ALTER TABLE "tbl_property_demand" ADD COLUMN     "garden_rebate" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tbl_property_master" ADD COLUMN     "isGarden" BOOLEAN NOT NULL DEFAULT false;
