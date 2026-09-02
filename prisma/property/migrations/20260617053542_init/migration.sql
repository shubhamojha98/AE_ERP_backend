/*
  Warnings:

  - The `cash_verify_id` column on the `tbl_transaction_master` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "tbl_transaction_master" DROP COLUMN "cash_verify_id",
ADD COLUMN     "cash_verify_id" INTEGER;
