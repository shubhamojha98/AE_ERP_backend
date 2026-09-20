/*
  Warnings:

  - You are about to drop the column `email` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Customer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customerPhone]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerName` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPhone` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Customer_name_idx";

-- DropIndex
DROP INDEX "Customer_phone_idx";

-- DropIndex
DROP INDEX "Customer_phone_key";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "customerPhone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EngineeringDesign" ADD COLUMN     "groupId" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "groupId" TEXT;

-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "groupId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerPhone_key" ON "Customer"("customerPhone");

-- CreateIndex
CREATE INDEX "Customer_customerName_idx" ON "Customer"("customerName");

-- CreateIndex
CREATE INDEX "Customer_customerPhone_idx" ON "Customer"("customerPhone");
