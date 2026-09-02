/*
  Warnings:

  - A unique constraint covering the columns `[qr_no]` on the table `tbl_property_master` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "tbl_qr_tagging" (
    "id" SERIAL NOT NULL,
    "qr_no" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "entryBy" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_qr_tagging_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_qr_tagging_qr_no_key" ON "tbl_qr_tagging"("qr_no");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_property_master_qr_no_key" ON "tbl_property_master"("qr_no");

-- AddForeignKey
ALTER TABLE "tbl_property_master" ADD CONSTRAINT "tbl_property_master_qr_no_fkey" FOREIGN KEY ("qr_no") REFERENCES "tbl_qr_tagging"("qr_no") ON DELETE SET NULL ON UPDATE CASCADE;
