-- AlterTable
ALTER TABLE "inventory"."product_categories" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "inventory"."product_sub_categories" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "inventory"."products" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
