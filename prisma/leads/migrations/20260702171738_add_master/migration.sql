/*
  Warnings:

  - You are about to drop the column `status` on the `lead_followup` table. All the data in the column will be lost.
  - You are about to drop the column `lead_source` on the `lead_master` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `lead_master` table. All the data in the column will be lost.
  - Added the required column `status_id` to the `lead_followup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lead_source_id` to the `lead_master` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status_id` to the `lead_master` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "lead_followup_status_idx";

-- DropIndex
DROP INDEX "lead_master_lead_source_idx";

-- DropIndex
DROP INDEX "lead_master_status_idx";

-- AlterTable
ALTER TABLE "lead_followup" DROP COLUMN "status",
ADD COLUMN     "status_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "lead_master" DROP COLUMN "lead_source",
DROP COLUMN "status",
ADD COLUMN     "lead_source_id" INTEGER NOT NULL,
ADD COLUMN     "status_id" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "LeadSource";

-- DropEnum
DROP TYPE "LeadStatus";

-- CreateTable
CREATE TABLE "lead_source_master" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "entryBy" INTEGER,
    "entryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "lead_source_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_status_master" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "entryBy" INTEGER,
    "entryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "lead_status_master_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_source_master_name_key" ON "lead_source_master"("name");

-- CreateIndex
CREATE INDEX "lead_source_master_recstatus_idx" ON "lead_source_master"("recstatus");

-- CreateIndex
CREATE UNIQUE INDEX "lead_status_master_name_key" ON "lead_status_master"("name");

-- CreateIndex
CREATE INDEX "lead_status_master_recstatus_idx" ON "lead_status_master"("recstatus");

-- CreateIndex
CREATE INDEX "lead_followup_status_id_idx" ON "lead_followup"("status_id");

-- CreateIndex
CREATE INDEX "lead_master_lead_source_id_idx" ON "lead_master"("lead_source_id");

-- CreateIndex
CREATE INDEX "lead_master_status_id_idx" ON "lead_master"("status_id");

-- AddForeignKey
ALTER TABLE "lead_master" ADD CONSTRAINT "lead_master_lead_source_id_fkey" FOREIGN KEY ("lead_source_id") REFERENCES "lead_source_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_master" ADD CONSTRAINT "lead_master_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "lead_status_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_followup" ADD CONSTRAINT "lead_followup_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "lead_status_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
