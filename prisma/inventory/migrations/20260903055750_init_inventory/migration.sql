/*
  Warnings:

  - You are about to drop the column `demoSeedId` on the `product_categories` table. All the data in the column will be lost.
  - You are about to drop the column `isDemo` on the `product_categories` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `product_categories` table. All the data in the column will be lost.
  - You are about to drop the column `parentCategory` on the `product_categories` table. All the data in the column will be lost.
  - You are about to drop the column `searchName` on the `product_categories` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `product_categories` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `demoSeedId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isDemo` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "inventory"."product_categories" DROP COLUMN "demoSeedId",
DROP COLUMN "isDemo",
DROP COLUMN "order",
DROP COLUMN "parentCategory",
DROP COLUMN "searchName",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "inventory"."products" DROP COLUMN "category",
DROP COLUMN "company",
DROP COLUMN "demoSeedId",
DROP COLUMN "isDemo",
ADD COLUMN     "subCategoryId" BIGINT;

-- CreateTable
CREATE TABLE "inventory"."product_sub_categories" (
    "id" BIGSERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "categoryId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "groupId" TEXT,
    "isDeleted" BOOLEAN DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "deletedBy" TEXT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" TEXT,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "product_sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_sub_categories_companyId_idx" ON "inventory"."product_sub_categories"("companyId");

-- CreateIndex
CREATE INDEX "product_sub_categories_categoryId_idx" ON "inventory"."product_sub_categories"("categoryId");

-- CreateIndex
CREATE INDEX "products_subCategoryId_idx" ON "inventory"."products"("subCategoryId");

-- AddForeignKey
ALTER TABLE "inventory"."product_sub_categories" ADD CONSTRAINT "product_sub_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "inventory"."product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."products" ADD CONSTRAINT "products_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "inventory"."product_sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
