-- CreateTable
CREATE TABLE "lead_source_master" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "description" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,
    "groupId" TEXT,

    CONSTRAINT "lead_source_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_master" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "leadNo" TEXT NOT NULL,
    "leadSourceId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "mobileNo" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "assignedTo" INTEGER,
    "lastFollowupDate" TIMESTAMP(3),
    "nextFollowupDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,
    "groupId" TEXT,

    CONSTRAINT "lead_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_followup" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "leadId" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL,
    "followupDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "nextFollowupDate" TIMESTAMP(3),
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" TEXT,

    CONSTRAINT "lead_followup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_source_master_name_key" ON "lead_source_master"("name");

-- CreateIndex
CREATE INDEX "lead_source_master_recStatus_idx" ON "lead_source_master"("recStatus");

-- CreateIndex
CREATE UNIQUE INDEX "lead_master_leadNo_key" ON "lead_master"("leadNo");

-- CreateIndex
CREATE INDEX "lead_master_mobileNo_idx" ON "lead_master"("mobileNo");

-- CreateIndex
CREATE INDEX "lead_master_assignedTo_idx" ON "lead_master"("assignedTo");

-- CreateIndex
CREATE INDEX "lead_master_leadSourceId_idx" ON "lead_master"("leadSourceId");

-- CreateIndex
CREATE INDEX "lead_followup_leadId_idx" ON "lead_followup"("leadId");

-- CreateIndex
CREATE INDEX "lead_followup_statusId_idx" ON "lead_followup"("statusId");

-- CreateIndex
CREATE INDEX "lead_followup_followupDate_idx" ON "lead_followup"("followupDate");

-- AddForeignKey
ALTER TABLE "lead_master" ADD CONSTRAINT "lead_master_leadSourceId_fkey" FOREIGN KEY ("leadSourceId") REFERENCES "lead_source_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_followup" ADD CONSTRAINT "lead_followup_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
