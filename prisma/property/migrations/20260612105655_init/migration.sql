/*
  Warnings:

  - The `polygonPoints` column on the `tbl_survey_property_master` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "tbl_survey_property_master" DROP COLUMN "polygonPoints",
ADD COLUMN     "polygonPoints" JSONB;
