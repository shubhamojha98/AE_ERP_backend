/*
  Warnings:

  - You are about to drop the column `polygonPoints` on the `tbl_survey_property_master` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_survey_property_master" DROP COLUMN "polygonPoints",
ADD COLUMN     "surveyPolygon" JSONB;
