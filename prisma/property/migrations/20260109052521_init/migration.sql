-- AlterTable
ALTER TABLE "tbl_collection_details" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "entryBy" INTEGER,
ADD COLUMN     "entry_ip_address" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "tbl_collection_details" ADD CONSTRAINT "tbl_collection_details_property_master_id_fkey" FOREIGN KEY ("property_master_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_collection_details" ADD CONSTRAINT "tbl_collection_details_demand_id_fkey" FOREIGN KEY ("demand_id") REFERENCES "tbl_property_demand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_collection_details" ADD CONSTRAINT "tbl_collection_details_trans_id_fkey" FOREIGN KEY ("trans_id") REFERENCES "tbl_transaction_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
