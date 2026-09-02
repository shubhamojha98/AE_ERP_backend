-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "inventory";

-- CreateTable
CREATE TABLE "inventory"."product_categories" (
    "id" BIGSERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "demoSeedId" TEXT,
    "description" TEXT,
    "isDemo" BOOLEAN DEFAULT false,
    "order" INTEGER,
    "parentCategory" INTEGER,
    "searchName" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "groupId" TEXT,
    "isDeleted" BOOLEAN DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "deletedBy" TEXT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" TEXT,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."products" (
    "id" BIGSERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "category" TEXT,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30),
    "categoryId" BIGINT,
    "company" TEXT,
    "cost" DECIMAL(65,30),
    "demoSeedId" TEXT,
    "description" TEXT,
    "discount" DECIMAL(65,30),
    "hsn" TEXT,
    "isDemo" BOOLEAN DEFAULT false,
    "lowStockThreshold" DECIMAL(65,30),
    "mrp" DECIMAL(65,30),
    "photos" JSONB,
    "searchName" TEXT,
    "sku" TEXT,
    "specs" JSONB,
    "status" TEXT,
    "tax" DECIMAL(65,30),
    "trackingType" TEXT,
    "unit" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "groupId" TEXT,
    "isDeleted" BOOLEAN DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "deletedBy" TEXT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" TEXT,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."warehouses" (
    "id" BIGSERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "address" TEXT,
    "capacity" DECIMAL(65,30),
    "city" TEXT,
    "code" TEXT,
    "demoSeedId" TEXT,
    "geofenceRadiusMeters" DECIMAL(65,30),
    "isDemo" BOOLEAN DEFAULT false,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "managerName" TEXT,
    "managerPhone" TEXT,
    "notes" TEXT,
    "pincode" TEXT,
    "searchName" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "groupId" TEXT,
    "isDeleted" BOOLEAN DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "deletedBy" TEXT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" TEXT,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."stock" (
    "id" BIGSERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "availableQty" DECIMAL(65,30) NOT NULL,
    "productId" BIGINT NOT NULL,
    "reservedQty" DECIMAL(65,30) NOT NULL,
    "warehouseId" BIGINT NOT NULL,
    "demoSeedId" TEXT,
    "isDemo" BOOLEAN DEFAULT false,
    "onHandQty" DECIMAL(65,30),
    "reorderLevel" DECIMAL(65,30),
    "stockId" TEXT,
    "unit" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "groupId" TEXT,
    "isDeleted" BOOLEAN DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "deletedBy" TEXT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" TEXT,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."stock_ledger" (
    "id" BIGSERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "afterQty" DECIMAL(65,30) NOT NULL,
    "beforeQty" DECIMAL(65,30) NOT NULL,
    "movementAt" TIMESTAMP(3) NOT NULL,
    "productId" BIGINT NOT NULL,
    "qty" DECIMAL(65,30) NOT NULL,
    "transactionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "warehouseId" BIGINT NOT NULL,
    "balanceAfter" DECIMAL(65,30),
    "date" TEXT,
    "demoSeedId" TEXT,
    "direction" TEXT,
    "isDemo" BOOLEAN DEFAULT false,
    "ledgerId" TEXT,
    "movementType" TEXT,
    "notes" TEXT,
    "product" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "sourceId" TEXT,
    "sourceType" TEXT,
    "unit" TEXT,
    "warehouse" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "groupId" TEXT,
    "isDeleted" BOOLEAN DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "deletedBy" TEXT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" TEXT,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "stock_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."dispatch" (
    "id" BIGSERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "warehouseId" BIGINT NOT NULL,
    "approvalStatus" TEXT,
    "cancellationOrderId" TEXT,
    "cancellationReason" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "customer" TEXT,
    "customerId" TEXT,
    "date" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "deliveredBy" TEXT,
    "deliveryConfirmed" BOOLEAN,
    "deliveryDate" TEXT,
    "deliveryOTPExpiresAt" TIMESTAMP(3),
    "deliveryOTPGeneratedAt" TIMESTAMP(3),
    "deliveryOTPHash" TEXT,
    "demoSeedId" TEXT,
    "isDemo" BOOLEAN DEFAULT false,
    "dispatchDate" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "dispatchId" TEXT,
    "dispatchNumber" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "items" JSONB,
    "lrNumber" TEXT,
    "notes" TEXT,
    "orderId" TEXT,
    "paymentReconciliationPending" BOOLEAN,
    "projectId" TEXT,
    "projectName" TEXT,
    "returnedAt" TIMESTAMP(3),
    "transporterId" TEXT,
    "vehicleNo" TEXT,
    "verifiedBy" TEXT,
    "warehouse" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "groupId" TEXT,
    "isDeleted" BOOLEAN DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "deletedBy" TEXT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" TEXT,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_companyId_idx" ON "inventory"."products"("companyId");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "inventory"."products"("categoryId");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "inventory"."products"("sku");

-- CreateIndex
CREATE INDEX "warehouses_companyId_idx" ON "inventory"."warehouses"("companyId");

-- CreateIndex
CREATE INDEX "warehouses_code_idx" ON "inventory"."warehouses"("code");

-- CreateIndex
CREATE INDEX "stock_companyId_idx" ON "inventory"."stock"("companyId");

-- CreateIndex
CREATE INDEX "stock_productId_idx" ON "inventory"."stock"("productId");

-- CreateIndex
CREATE INDEX "stock_warehouseId_idx" ON "inventory"."stock"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_productId_warehouseId_key" ON "inventory"."stock"("productId", "warehouseId");

-- CreateIndex
CREATE INDEX "stock_ledger_companyId_idx" ON "inventory"."stock_ledger"("companyId");

-- CreateIndex
CREATE INDEX "stock_ledger_productId_idx" ON "inventory"."stock_ledger"("productId");

-- CreateIndex
CREATE INDEX "stock_ledger_warehouseId_idx" ON "inventory"."stock_ledger"("warehouseId");

-- CreateIndex
CREATE INDEX "stock_ledger_transactionId_idx" ON "inventory"."stock_ledger"("transactionId");

-- CreateIndex
CREATE INDEX "stock_ledger_movementAt_idx" ON "inventory"."stock_ledger"("movementAt");

-- CreateIndex
CREATE INDEX "dispatch_companyId_idx" ON "inventory"."dispatch"("companyId");

-- CreateIndex
CREATE INDEX "dispatch_warehouseId_idx" ON "inventory"."dispatch"("warehouseId");

-- CreateIndex
CREATE INDEX "dispatch_status_idx" ON "inventory"."dispatch"("status");

-- CreateIndex
CREATE INDEX "dispatch_dispatchNumber_idx" ON "inventory"."dispatch"("dispatchNumber");

-- AddForeignKey
ALTER TABLE "inventory"."products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "inventory"."product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock" ADD CONSTRAINT "stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "inventory"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock" ADD CONSTRAINT "stock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "inventory"."warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_ledger" ADD CONSTRAINT "stock_ledger_productId_fkey" FOREIGN KEY ("productId") REFERENCES "inventory"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_ledger" ADD CONSTRAINT "stock_ledger_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "inventory"."warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."dispatch" ADD CONSTRAINT "dispatch_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "inventory"."warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
