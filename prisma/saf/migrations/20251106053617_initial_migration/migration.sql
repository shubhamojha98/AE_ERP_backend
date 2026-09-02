-- CreateTable
CREATE TABLE "public"."tbl_constructionType_master" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER,
    "constructionType_name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_constructionType_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_roadType_master" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER,
    "roadType_name" TEXT NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_roadType_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_propertyType_master" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER,
    "propertyType_name" TEXT NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_propertyType_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_areaType_master" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER,
    "areaType_name" TEXT NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_areaType_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_occupancyType_master" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER,
    "occupancyType_name" TEXT NOT NULL,
    "multiplying_factor" DOUBLE PRECISION,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_occupancyType_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_usageType_master" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER,
    "usageType_name" TEXT NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_usageType_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_subUsageType_master" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER,
    "usageType_id" INTEGER NOT NULL,
    "subUsageType_name" TEXT NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_subUsageType_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_constructionAge_master" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER,
    "constructionAge_name" TEXT NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_constructionAge_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_wardRate_master" (
    "id" SERIAL NOT NULL,
    "const_typeId" INTEGER NOT NULL,
    "road_typeId" INTEGER NOT NULL,
    "ward_rate" DOUBLE PRECISION NOT NULL,
    "wardArea_Id" INTEGER NOT NULL,
    "ulb_id" INTEGER,
    "date_of_effect" TIMESTAMP(3) NOT NULL DEFAULT '2025-04-01 00:00:00 +00:00',
    "recstatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_wardRate_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_wardArea_master" (
    "id" SERIAL NOT NULL,
    "wardArea_name" TEXT NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,
    "ulb_id" INTEGER,

    CONSTRAINT "tbl_wardArea_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_ownerShipType_master" (
    "id" SERIAL NOT NULL,
    "ownerShip_name" TEXT NOT NULL,
    "ulb_id" INTEGER,

    CONSTRAINT "tbl_ownerShipType_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_floors_master" (
    "id" SERIAL NOT NULL,
    "floor_name" TEXT NOT NULL,
    "ulb_id" INTEGER,
    "recstatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_floors_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_owner_details" (
    "id" SERIAL NOT NULL,
    "ownerShip_id" INTEGER NOT NULL,
    "ownerShip_name" TEXT,
    "guardian_name" TEXT,
    "contact_no" INTEGER NOT NULL,
    "PAN_no" TEXT,
    "Phone_no" TEXT,
    "Email_Address" TEXT NOT NULL,
    "ulb_id" INTEGER,

    CONSTRAINT "tbl_owner_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_waterConnection_type" (
    "id" SERIAL NOT NULL,
    "waterConType" TEXT NOT NULL,

    CONSTRAINT "tbl_waterConnection_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_fixed_waterTax" (
    "id" SERIAL NOT NULL,
    "waterTax" TEXT NOT NULL,

    CONSTRAINT "tbl_fixed_waterTax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_constAge" (
    "id" SERIAL NOT NULL,
    "const_Age" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_constAge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tbl_fy_year_list" (
    "pk_id" BIGSERIAL NOT NULL,
    "fyyearname" VARCHAR(50),
    "fystartdate" DATE,
    "fyenddate" DATE,
    "entrydatetime" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "entryby" BIGINT DEFAULT 1,
    "recstatus" SMALLINT DEFAULT 1,

    CONSTRAINT "tbl_fy_year_list_pkey" PRIMARY KEY ("pk_id")
);

-- CreateTable
CREATE TABLE "public"."tbl_propertyDoc_master" (
    "id" SERIAL NOT NULL,
    "doc_type" TEXT NOT NULL,
    "is_mand" INTEGER,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "order_no" INTEGER,

    CONSTRAINT "tbl_propertyDoc_master_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."tbl_subUsageType_master" ADD CONSTRAINT "tbl_subUsageType_master_usageType_id_fkey" FOREIGN KEY ("usageType_id") REFERENCES "public"."tbl_usageType_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_wardRate_master" ADD CONSTRAINT "tbl_wardRate_master_const_typeId_fkey" FOREIGN KEY ("const_typeId") REFERENCES "public"."tbl_constructionType_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_wardRate_master" ADD CONSTRAINT "tbl_wardRate_master_road_typeId_fkey" FOREIGN KEY ("road_typeId") REFERENCES "public"."tbl_roadType_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_wardRate_master" ADD CONSTRAINT "tbl_wardRate_master_wardArea_Id_fkey" FOREIGN KEY ("wardArea_Id") REFERENCES "public"."tbl_wardArea_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tbl_owner_details" ADD CONSTRAINT "tbl_owner_details_ownerShip_id_fkey" FOREIGN KEY ("ownerShip_id") REFERENCES "public"."tbl_ownerShipType_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
