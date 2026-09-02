/*
  Warnings:

  - The `cash_verify_status` column on the `tbl_transaction_master` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "tbl_transaction_master" DROP COLUMN "cash_verify_status",
ADD COLUMN     "cash_verify_status" INTEGER DEFAULT 0;
