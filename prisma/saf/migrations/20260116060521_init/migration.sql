-- AlterTable
ALTER TABLE "tbl_wardRate_master" ADD COLUMN     "wardArea_id" INTEGER;

-- AddForeignKey
ALTER TABLE "tbl_wardRate_master" ADD CONSTRAINT "tbl_wardRate_master_wardArea_id_fkey" FOREIGN KEY ("wardArea_id") REFERENCES "tbl_wardArea_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;
