-- CreateTable
CREATE TABLE "tbl_collection_details" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER NOT NULL,
    "ward_id" INTEGER NOT NULL,
    "property_master_id" INTEGER NOT NULL,
    "demand_id" INTEGER NOT NULL,
    "trans_id" INTEGER NOT NULL,
    "house_tax" DOUBLE PRECISION NOT NULL,
    "water_tax" DOUBLE PRECISION NOT NULL,
    "waste_tax" DOUBLE PRECISION NOT NULL,
    "total_tax" DOUBLE PRECISION NOT NULL,
    "saf_fy_year_id" INTEGER NOT NULL,
    "saf_fy_year" INTEGER NOT NULL,
    "late_submission" INTEGER,
    "yearly_demand" INTEGER,
    "balance_amount" INTEGER,
    "old_ward_id" INTEGER,
    "vacant_tax_demand" INTEGER,
    "difference_amount" INTEGER,

    CONSTRAINT "tbl_collection_details_pkey" PRIMARY KEY ("id")
);
