-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('DIGITAL_MARKETING', 'WEBSITE', 'CHANNEL_PARTNER', 'DIRECT_SALES', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'SITE_VISIT_SCHEDULED', 'QUALIFIED', 'PROPOSAL_STAGE', 'LOST');

-- CreateTable
CREATE TABLE "lead_master" (
    "id" SERIAL NOT NULL,
    "lead_no" TEXT NOT NULL,
    "lead_source" "LeadSource" NOT NULL,
    "customer_name" TEXT NOT NULL,
    "mobile_no" TEXT NOT NULL,
    "alternate_mobile_no" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "assigned_to" INTEGER,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "last_followup_date" TIMESTAMP(3),
    "next_followup_date" TIMESTAMP(3),
    "remarks" TEXT,
    "entryBy" INTEGER,
    "entryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "lead_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_followup" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "followup_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "LeadStatus" NOT NULL,
    "remarks" TEXT,
    "next_followup_date" TIMESTAMP(3),
    "entryBy" INTEGER,
    "entryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_followup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_master_lead_no_key" ON "lead_master"("lead_no");

-- CreateIndex
CREATE INDEX "lead_master_mobile_no_idx" ON "lead_master"("mobile_no");

-- CreateIndex
CREATE INDEX "lead_master_status_idx" ON "lead_master"("status");

-- CreateIndex
CREATE INDEX "lead_master_lead_source_idx" ON "lead_master"("lead_source");

-- CreateIndex
CREATE INDEX "lead_master_assigned_to_idx" ON "lead_master"("assigned_to");

-- CreateIndex
CREATE INDEX "lead_followup_lead_id_idx" ON "lead_followup"("lead_id");

-- CreateIndex
CREATE INDEX "lead_followup_followup_date_idx" ON "lead_followup"("followup_date");

-- CreateIndex
CREATE INDEX "lead_followup_status_idx" ON "lead_followup"("status");

-- AddForeignKey
ALTER TABLE "lead_followup" ADD CONSTRAINT "lead_followup_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
