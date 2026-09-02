/*
  Warnings:

  - Added the required column `multiply_factor` to the `tbl_subUsageType_master` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_subUsageType_master" ADD COLUMN     "multiply_factor" INTEGER NOT NULL;
