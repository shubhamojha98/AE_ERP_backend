-- CreateTable
CREATE TABLE "tbl_property_doc_verification" (
    "id" SERIAL NOT NULL,
    "propertyMaster_id" INTEGER NOT NULL,
    "property_doc_id" INTEGER NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "entryBy" INTEGER NOT NULL,
    "enrty_ipAddress" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,

    CONSTRAINT "tbl_property_doc_verification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tbl_property_doc_verification" ADD CONSTRAINT "tbl_property_doc_verification_property_doc_id_fkey" FOREIGN KEY ("property_doc_id") REFERENCES "tbl_property_document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_property_doc_verification" ADD CONSTRAINT "tbl_property_doc_verification_propertyMaster_id_fkey" FOREIGN KEY ("propertyMaster_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
