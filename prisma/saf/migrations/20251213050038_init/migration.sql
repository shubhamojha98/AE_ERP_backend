/*
  Warnings:

  - You are about to drop the column `wardArea_Id` on the `tbl_wardRate_master` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."tbl_wardRate_master" DROP CONSTRAINT "tbl_wardRate_master_wardArea_Id_fkey";

-- AlterTable
ALTER TABLE "tbl_wardRate_master" DROP COLUMN "wardArea_Id",
ADD COLUMN     "ward_id" INTEGER;
