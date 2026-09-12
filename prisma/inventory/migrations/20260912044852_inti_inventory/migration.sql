-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "inventory";

-- CreateTable
CREATE TABLE "inventory"."product_categories" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "categoryName" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "groupId" TEXT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" TEXT,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."products" (
    "id" BIGSERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "hsn" TEXT NOT NULL,
    "productPrice" DECIMAL(15,2) NOT NULL,
    "gstRate" DECIMAL(5,2) NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "description" TEXT,
    "photo" TEXT,
    "status" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "groupId" TEXT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" TEXT,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."warehouses" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "warehouseName" TEXT NOT NULL,
    "warehouseLocation" TEXT NOT NULL,
    "capacity" DECIMAL(15,2) NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "code" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "managerName" TEXT,
    "managerPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "groupId" TEXT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" TEXT,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."stock" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "productId" BIGINT NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "availableQty" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "reservedQty" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3),
    "updatedBy" TEXT,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_companyId_idx" ON "inventory"."products"("companyId");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "inventory"."products"("categoryId");

-- CreateIndex
CREATE INDEX "products_productName_idx" ON "inventory"."products"("productName");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "inventory"."products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_companyId_sku_key" ON "inventory"."products"("companyId", "sku");

-- CreateIndex
CREATE INDEX "warehouses_companyId_idx" ON "inventory"."warehouses"("companyId");

-- CreateIndex
CREATE INDEX "warehouses_warehouseName_idx" ON "inventory"."warehouses"("warehouseName");

-- CreateIndex
CREATE INDEX "warehouses_warehouseLocation_idx" ON "inventory"."warehouses"("warehouseLocation");

-- CreateIndex
CREATE INDEX "stock_companyId_idx" ON "inventory"."stock"("companyId");

-- CreateIndex
CREATE INDEX "stock_productId_idx" ON "inventory"."stock"("productId");

-- CreateIndex
CREATE INDEX "stock_warehouseId_idx" ON "inventory"."stock"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_productId_warehouseId_key" ON "inventory"."stock"("productId", "warehouseId");

-- AddForeignKey
ALTER TABLE "inventory"."products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "inventory"."product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock" ADD CONSTRAINT "stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "inventory"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock" ADD CONSTRAINT "stock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "inventory"."warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
