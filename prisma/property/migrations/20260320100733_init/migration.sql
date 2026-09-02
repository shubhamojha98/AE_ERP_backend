/*
  Warnings:

  - Added the required column `part_house_tax` to the `tbl_property_demand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `part_total_tax` to the `tbl_property_demand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `part_waste_tax` to the `tbl_property_demand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `part_water_tax` to the `tbl_property_demand` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_property_demand" ADD COLUMN     "part_house_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "part_total_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "part_waste_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "part_water_tax" DOUBLE PRECISION NOT NULL DEFAULT 0;
