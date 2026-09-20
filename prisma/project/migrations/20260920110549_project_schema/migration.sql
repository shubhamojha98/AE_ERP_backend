-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('QUOTATION', 'SURVEY', 'SERVICE', 'HANDOVER', 'SUBSIDY', 'NET_METERING');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EngineeringStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "customerCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "projectCode" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "leadId" TEXT,
    "capacityKw" DECIMAL(10,2) NOT NULL,
    "projectType" TEXT NOT NULL,
    "stage" "ProjectStage" NOT NULL DEFAULT 'QUOTATION',
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "salesOwnerId" INTEGER,
    "salesOwnerName" TEXT,
    "surveyorId" INTEGER,
    "surveyorName" TEXT,
    "installerId" INTEGER,
    "installerName" TEXT,
    "managerId" INTEGER,
    "managerName" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "landmark" TEXT,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "notes" TEXT,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" SERIAL NOT NULL,
    "surveyId" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "surveyorId" INTEGER,
    "status" "SurveyStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineeringDesign" (
    "id" SERIAL NOT NULL,
    "designId" TEXT NOT NULL,
    "surveyId" INTEGER NOT NULL,
    "capacityKw" DECIMAL(10,2),
    "designerId" INTEGER,
    "status" "EngineeringStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "EngineeringDesign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerCode_key" ON "Customer"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectCode_key" ON "Project"("projectCode");

-- CreateIndex
CREATE INDEX "Project_customerId_idx" ON "Project"("customerId");

-- CreateIndex
CREATE INDEX "Project_stage_idx" ON "Project"("stage");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_salesOwnerId_idx" ON "Project"("salesOwnerId");

-- CreateIndex
CREATE INDEX "Project_surveyorId_idx" ON "Project"("surveyorId");

-- CreateIndex
CREATE INDEX "Project_installerId_idx" ON "Project"("installerId");

-- CreateIndex
CREATE INDEX "Project_managerId_idx" ON "Project"("managerId");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Survey_surveyId_key" ON "Survey"("surveyId");

-- CreateIndex
CREATE INDEX "Survey_projectId_idx" ON "Survey"("projectId");

-- CreateIndex
CREATE INDEX "Survey_status_idx" ON "Survey"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EngineeringDesign_designId_key" ON "EngineeringDesign"("designId");

-- CreateIndex
CREATE UNIQUE INDEX "EngineeringDesign_surveyId_key" ON "EngineeringDesign"("surveyId");

-- CreateIndex
CREATE INDEX "EngineeringDesign_surveyId_idx" ON "EngineeringDesign"("surveyId");

-- CreateIndex
CREATE INDEX "EngineeringDesign_status_idx" ON "EngineeringDesign"("status");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringDesign" ADD CONSTRAINT "EngineeringDesign_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
