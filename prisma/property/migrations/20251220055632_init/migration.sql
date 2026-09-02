-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('Part', 'Full');

-- CreateTable
CREATE TABLE "tbl_property_master" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER NOT NULL,
    "wardArea_id" INTEGER NOT NULL,
    "property_type_id" INTEGER NOT NULL,
    "road_type_id" INTEGER NOT NULL,
    "const_type_id" INTEGER,
    "usage_type_id" INTEGER NOT NULL,
    "ownershipType_id" INTEGER NOT NULL,
    "zone_id" INTEGER NOT NULL,
    "ward_id" INTEGER,
    "area_type" INTEGER,
    "saf_type" TEXT NOT NULL,
    "saf_fyYear_id" INTEGER NOT NULL,
    "saf_fy_Year" TEXT NOT NULL,
    "unique_Property_Id" TEXT NOT NULL,
    "saf_no" TEXT NOT NULL,
    "new_holding_no" TEXT,
    "primary_contact_no" TEXT NOT NULL,
    "rain_water_harvest" TEXT,
    "plot_area" DOUBLE PRECISION,
    "builtup_ground_floor" DOUBLE PRECISION,
    "construction_date" TIMESTAMP(3) NOT NULL,
    "water_conn_type" TEXT,
    "water_tax_type" TEXT,
    "approval_by" INTEGER,
    "approval_datetime" TIMESTAMP(3),
    "approval_status" INTEGER,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "status_type" INTEGER,
    "updatedTime" TIMESTAMP(3),
    "update_by" INTEGER,
    "update_ipAddress" TEXT,
    "entryDateTime" TIMESTAMP(3),
    "entryBy" INTEGER,
    "entry_ipAddress" TEXT,
    "waterPay_status" TEXT,
    "lateSubmission_pay_status" TEXT,
    "late_submission" TEXT,
    "holding_type" TEXT,
    "current_front_property_image" TEXT,
    "qr_no" TEXT,
    "const_age" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_property_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_property_owner" (
    "id" SERIAL NOT NULL,
    "propertyMaster_id" INTEGER NOT NULL,
    "honorific" TEXT,
    "owner_name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "guardian_name" TEXT,
    "relation" TEXT,
    "contact_no" TEXT NOT NULL,
    "pan_no" TEXT,
    "owner_photo_doc" TEXT,
    "recStatus" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT,
    "updateIpAddress" TEXT,
    "entryBy" INTEGER NOT NULL,
    "entryIpAddress" TEXT,
    "owner_id_proof_doc" TEXT,
    "owner_image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_property_owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_owner_document" (
    "id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "property_master_id" INTEGER NOT NULL,
    "document_id" INTEGER NOT NULL,
    "reciept_filename" TEXT NOT NULL,
    "path_name" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "entryBy" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_owner_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_property_details" (
    "id" SERIAL NOT NULL,
    "propertyMaster_id" INTEGER NOT NULL,
    "prim_houseNo" TEXT,
    "prim_mohalla" TEXT NOT NULL,
    "prim_address" TEXT NOT NULL,
    "prim_pincode" TEXT NOT NULL,
    "corres_houseNo" TEXT,
    "corres_mohalla" TEXT NOT NULL,
    "corres_address" TEXT NOT NULL,
    "corres_pincode" TEXT NOT NULL,
    "phone_no" TEXT NOT NULL,
    "email_id" TEXT,
    "khata_no" TEXT,
    "plot_no" TEXT,
    "mauja_name" TEXT,
    "old_ward_no" TEXT,
    "old_holding_no" TEXT,
    "old_unique_property_id" TEXT,
    "rain_water_harvest_doc" TEXT,
    "entry_by" INTEGER,
    "entry_IpAddress" TEXT,
    "building_name" TEXT,
    "thana_no" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_property_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_property_floor" (
    "id" SERIAL NOT NULL,
    "propertyMaster_id" INTEGER NOT NULL,
    "floorType_name" TEXT NOT NULL,
    "usageType_name" TEXT NOT NULL,
    "usgaeFactor_name" TEXT NOT NULL,
    "occupancyType_name" TEXT NOT NULL,
    "constType_name" TEXT NOT NULL,
    "builtup_area" DOUBLE PRECISION,
    "room_veranda_area" DOUBLE PRECISION,
    "balcony_kitchen_area" DOUBLE PRECISION,
    "sub_usage_type" INTEGER,
    "garage_area" DOUBLE PRECISION,
    "assess_from" TIMESTAMP(3),
    "assess_upto" TIMESTAMP(3),
    "assess_from_year" TEXT NOT NULL,
    "assess_upto_year" TEXT NOT NULL,
    "saf_fy_year_id" INTEGER NOT NULL,
    "saf_fy_year" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "updateBy" TEXT,
    "update_IpAddress" TEXT,
    "entryBy" INTEGER,
    "entry_IpAddress" TEXT,
    "floor_type_id" INTEGER NOT NULL,
    "usage_type_id" INTEGER NOT NULL,
    "usage_factor_id" INTEGER NOT NULL,
    "occupancy_type_id" INTEGER NOT NULL,
    "construction_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_property_floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_geoTagging" (
    "id" SERIAL NOT NULL,
    "propertyMaster_id" INTEGER NOT NULL,
    "latitude" TEXT,
    "longitude" TEXT,
    "document_id" INTEGER NOT NULL,
    "reciept_filename" TEXT NOT NULL,
    "path_name" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_geoTagging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_property_demand" (
    "id" SERIAL NOT NULL,
    "propertyMaster_id" INTEGER NOT NULL,
    "wardArea_id" INTEGER NOT NULL,
    "saf_fy_year_id" BIGINT NOT NULL,
    "saf_fy_year" TEXT NOT NULL,
    "ward_rate" DOUBLE PRECISION NOT NULL,
    "arv_rate" DOUBLE PRECISION NOT NULL,
    "carpetArv_rate" DOUBLE PRECISION NOT NULL,
    "const_age" INTEGER NOT NULL,
    "constAge_tax" DOUBLE PRECISION NOT NULL,
    "house_tax" DOUBLE PRECISION NOT NULL,
    "water_tax" DOUBLE PRECISION NOT NULL,
    "waste_tax" DOUBLE PRECISION NOT NULL,
    "total_tax" DOUBLE PRECISION NOT NULL,
    "late_submission" DOUBLE PRECISION,
    "paid_status" INTEGER NOT NULL DEFAULT 0,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_property_demand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_property_document" (
    "id" SERIAL NOT NULL,
    "propertyMaster_id" INTEGER NOT NULL,
    "document_id" INTEGER NOT NULL,
    "receipt_filename" TEXT NOT NULL,
    "path_name" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "entryBy" INTEGER NOT NULL,
    "enrty_ipAddress" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_property_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_property_penalty" (
    "id" SERIAL NOT NULL,
    "propDemand_id" INTEGER NOT NULL,
    "propertyMaster_id" INTEGER NOT NULL,
    "penalty_amount" DOUBLE PRECISION NOT NULL,
    "penalty_percentage" INTEGER NOT NULL,
    "fy_id" INTEGER,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_property_penalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_property_deactivate" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER NOT NULL,
    "propertyMaster_id" INTEGER NOT NULL,
    "ward_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "entryBy" INTEGER NOT NULL,
    "entryIpAddress" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_property_deactivate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_saf_arv_details" (
    "id" SERIAL NOT NULL,
    "property_master_id" INTEGER NOT NULL,
    "saf_fy_Year" TEXT NOT NULL,
    "floor_name" TEXT,
    "usage_name" TEXT,
    "usage_type_factor" TEXT,
    "construction_type" TEXT NOT NULL,
    "occupancy_type" TEXT,
    "builtup_area" DOUBLE PRECISION NOT NULL,
    "ward_rate" DOUBLE PRECISION NOT NULL,
    "occupancy_rate" DOUBLE PRECISION,
    "arv_rate" DOUBLE PRECISION NOT NULL,
    "property_percentage" DOUBLE PRECISION,
    "assess_from" TIMESTAMP(3),
    "assess_upto" TIMESTAMP(3),
    "saf_fy_year_id" INTEGER NOT NULL,
    "saf_fy_year" TEXT NOT NULL,
    "yearly_tax" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "updateBy" TEXT,
    "update_ip_address" TEXT,
    "entryBy" INTEGER,
    "entry_ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_saf_arv_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_property_owner_tax" (
    "id" SERIAL NOT NULL,
    "property_master_id" INTEGER NOT NULL,
    "saf_fy_Year" TEXT NOT NULL,
    "annual_floor_tax" DOUBLE PRECISION,
    "annual_vacant_tax" DOUBLE PRECISION,
    "annual_total" DOUBLE PRECISION NOT NULL,
    "saf_fy_year_id" INTEGER NOT NULL,
    "saf_fy_year" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "updateBy" TEXT,
    "update_ip_address" TEXT,
    "entryBy" INTEGER,
    "entry_ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_property_owner_tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_transaction_master" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER NOT NULL,
    "ward_id" INTEGER NOT NULL,
    "property_master_id" INTEGER NOT NULL,
    "trans_no" TEXT NOT NULL,
    "trans_date" TIMESTAMP(3) NOT NULL,
    "due_from" TEXT NOT NULL,
    "due_upto" TEXT NOT NULL,
    "actual_demand" DOUBLE PRECISION NOT NULL,
    "penalty" DOUBLE PRECISION NOT NULL,
    "water_charge" DOUBLE PRECISION NOT NULL,
    "Type" "TransactionType",
    "late_submission" DOUBLE PRECISION,
    "rain_water_harvest" TEXT,
    "rebate_early" DOUBLE PRECISION,
    "total_rebate" DOUBLE PRECISION,
    "payable_amount" DOUBLE PRECISION,
    "advance" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT NOT NULL,
    "payment_mode" TEXT,
    "cancel_status" TEXT,
    "cash_verify_status" TEXT,
    "cash_verify_id" TEXT,
    "verify_date_time" TIMESTAMP(3),
    "scheme" TEXT,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "updateBy" TEXT,
    "update_ip_address" TEXT,
    "entryBy" INTEGER,
    "entry_ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_transaction_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_transaction_details" (
    "id" SERIAL NOT NULL,
    "property_master_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "upi_cheque_cardtrans_id_neftref_no" TEXT,
    "cheque_neft_date" TIMESTAMP(3),
    "branch_name" TEXT,
    "bank_name" TEXT,
    "card_type" TEXT,
    "card_no" TEXT,
    "card_holder_name" TEXT,
    "paid_amount" DOUBLE PRECISION NOT NULL,
    "transaction_status" TEXT,
    "reconcile_date" TIMESTAMP(3),
    "remarks" TEXT,
    "upi_cheque_dd_image" TEXT,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "updateBy" TEXT,
    "update_ip_address" TEXT,
    "entryBy" INTEGER,
    "entry_ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_transaction_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_property_advance" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER NOT NULL,
    "property_master_id" INTEGER NOT NULL,
    "ward_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance_amount" DOUBLE PRECISION NOT NULL,
    "advance_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "updateBy" TEXT,
    "update_ip_address" TEXT,
    "entryBy" INTEGER,
    "entry_ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_property_advance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_transaction_deactivate" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER NOT NULL,
    "ward_id" INTEGER NOT NULL,
    "property_master_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "file_name" TEXT,
    "remarks" TEXT,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "updateBy" TEXT,
    "update_ip_address" TEXT,
    "entryBy" INTEGER,
    "entry_ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_transaction_deactivate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_survey_property_master" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER NOT NULL,
    "wardArea_id" INTEGER NOT NULL,
    "property_type_id" INTEGER NOT NULL,
    "road_type_id" INTEGER NOT NULL,
    "const_type_id" INTEGER,
    "usage_type_id" INTEGER NOT NULL,
    "ownershipType_id" INTEGER NOT NULL,
    "zone_id" INTEGER NOT NULL,
    "ward_id" INTEGER,
    "saf_type" TEXT NOT NULL,
    "saf_fyYear_id" INTEGER NOT NULL,
    "saf_fy_Year" TEXT NOT NULL,
    "unique_Property_Id" TEXT NOT NULL,
    "saf_no" TEXT NOT NULL,
    "new_holding_no" TEXT,
    "primary_contact_no" TEXT NOT NULL,
    "rain_water_harvest" TEXT,
    "plot_area" DOUBLE PRECISION,
    "builtup_ground_floor" DOUBLE PRECISION,
    "construction_date" TIMESTAMP(3) NOT NULL,
    "water_conn_type" TEXT,
    "water_tax_type" TEXT,
    "approval_by" INTEGER,
    "approval_datetime" TIMESTAMP(3),
    "approval_status" INTEGER,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "status_type" INTEGER,
    "updatedTime" TIMESTAMP(3),
    "update_by" INTEGER,
    "update_ipAddress" TEXT,
    "entryDateTime" TIMESTAMP(3),
    "entryBy" INTEGER,
    "entry_ipAddress" TEXT,
    "waterPay_status" TEXT,
    "lateSubmission_pay_status" TEXT,
    "late_submission" TEXT,
    "holding_type" TEXT,
    "const_age" INTEGER NOT NULL DEFAULT 1,
    "unique_survey_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_survey_property_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_survey_property_details" (
    "id" SERIAL NOT NULL,
    "propertyMaster_id" INTEGER NOT NULL,
    "prim_houseNo" TEXT,
    "prim_mohalla" TEXT NOT NULL,
    "prim_address" TEXT NOT NULL,
    "prim_pincode" TEXT NOT NULL,
    "corres_houseNo" TEXT,
    "corres_mohalla" TEXT NOT NULL,
    "corres_address" TEXT NOT NULL,
    "corres_pincode" TEXT NOT NULL,
    "phone_no" TEXT NOT NULL,
    "email_id" TEXT,
    "khata_no" TEXT,
    "plot_no" TEXT,
    "mauja_name" TEXT,
    "old_ward_no" TEXT,
    "old_holding_no" TEXT,
    "old_unique_property_id" TEXT,
    "rain_water_harvest_doc" TEXT,
    "entry_by" INTEGER,
    "entry_IpAddress" TEXT,
    "building_name" TEXT,
    "thana_no" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_survey_property_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_survey_property_floor" (
    "id" SERIAL NOT NULL,
    "propertyMaster_id" INTEGER NOT NULL,
    "floorType_name" TEXT NOT NULL,
    "usageType_name" TEXT NOT NULL,
    "usgaeFactor_name" TEXT NOT NULL,
    "occupancyType_name" TEXT NOT NULL,
    "constType_name" TEXT NOT NULL,
    "builtup_area" DOUBLE PRECISION,
    "assess_from" TIMESTAMP(3),
    "assess_upto" TIMESTAMP(3),
    "assess_from_year" TEXT NOT NULL,
    "assess_upto_year" TEXT NOT NULL,
    "saf_fy_year_id" INTEGER NOT NULL,
    "saf_fy_year" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "updateBy" TEXT,
    "update_IpAddress" TEXT,
    "entryBy" INTEGER,
    "entry_IpAddress" TEXT,
    "floor_type_id" INTEGER NOT NULL,
    "usage_type_id" INTEGER NOT NULL,
    "usage_factor_id" INTEGER NOT NULL,
    "occupancy_type_id" INTEGER NOT NULL,
    "construction_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_survey_property_floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_survey_property_owner" (
    "id" SERIAL NOT NULL,
    "propertyMaster_id" INTEGER NOT NULL,
    "honorific" TEXT,
    "owner_name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "guardian_name" TEXT,
    "relation" TEXT,
    "contact_no" TEXT NOT NULL,
    "pan_no" TEXT,
    "owner_photo_doc" TEXT,
    "recStatus" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT,
    "updateIpAddress" TEXT,
    "entryBy" INTEGER NOT NULL,
    "entryIpAddress" TEXT,
    "owner_id_proof_doc" TEXT,
    "owner_image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_survey_property_owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_survey_owner_document" (
    "id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "document_id" INTEGER NOT NULL,
    "reciept_filename" TEXT NOT NULL,
    "path_name" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "entryBy" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_survey_owner_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_survey_property_document" (
    "id" SERIAL NOT NULL,
    "propertyMaster_id" INTEGER NOT NULL,
    "document_id" INTEGER NOT NULL,
    "receipt_filename" TEXT NOT NULL,
    "path_name" TEXT NOT NULL,
    "recstatus" INTEGER NOT NULL DEFAULT 1,
    "entryBy" INTEGER NOT NULL,
    "entryIpAddress" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_survey_property_document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_property_details_propertyMaster_id_key" ON "tbl_property_details"("propertyMaster_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_survey_property_details_propertyMaster_id_key" ON "tbl_survey_property_details"("propertyMaster_id");

-- AddForeignKey
ALTER TABLE "tbl_property_owner" ADD CONSTRAINT "tbl_property_owner_propertyMaster_id_fkey" FOREIGN KEY ("propertyMaster_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_owner_document" ADD CONSTRAINT "tbl_owner_document_property_master_id_fkey" FOREIGN KEY ("property_master_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_owner_document" ADD CONSTRAINT "tbl_owner_document_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "tbl_property_owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_property_details" ADD CONSTRAINT "tbl_property_details_propertyMaster_id_fkey" FOREIGN KEY ("propertyMaster_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_property_floor" ADD CONSTRAINT "tbl_property_floor_propertyMaster_id_fkey" FOREIGN KEY ("propertyMaster_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_geoTagging" ADD CONSTRAINT "tbl_geoTagging_propertyMaster_id_fkey" FOREIGN KEY ("propertyMaster_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_property_demand" ADD CONSTRAINT "tbl_property_demand_propertyMaster_id_fkey" FOREIGN KEY ("propertyMaster_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_property_document" ADD CONSTRAINT "tbl_property_document_propertyMaster_id_fkey" FOREIGN KEY ("propertyMaster_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_property_penalty" ADD CONSTRAINT "tbl_property_penalty_propDemand_id_fkey" FOREIGN KEY ("propDemand_id") REFERENCES "tbl_property_demand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_property_penalty" ADD CONSTRAINT "tbl_property_penalty_propertyMaster_id_fkey" FOREIGN KEY ("propertyMaster_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_property_deactivate" ADD CONSTRAINT "tbl_property_deactivate_propertyMaster_id_fkey" FOREIGN KEY ("propertyMaster_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_saf_arv_details" ADD CONSTRAINT "tbl_saf_arv_details_property_master_id_fkey" FOREIGN KEY ("property_master_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_property_owner_tax" ADD CONSTRAINT "tbl_property_owner_tax_property_master_id_fkey" FOREIGN KEY ("property_master_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_transaction_master" ADD CONSTRAINT "tbl_transaction_master_property_master_id_fkey" FOREIGN KEY ("property_master_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_transaction_details" ADD CONSTRAINT "tbl_transaction_details_property_master_id_fkey" FOREIGN KEY ("property_master_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_transaction_details" ADD CONSTRAINT "tbl_transaction_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "tbl_transaction_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_property_advance" ADD CONSTRAINT "tbl_property_advance_property_master_id_fkey" FOREIGN KEY ("property_master_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_property_advance" ADD CONSTRAINT "tbl_property_advance_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "tbl_transaction_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_transaction_deactivate" ADD CONSTRAINT "tbl_transaction_deactivate_property_master_id_fkey" FOREIGN KEY ("property_master_id") REFERENCES "tbl_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_transaction_deactivate" ADD CONSTRAINT "tbl_transaction_deactivate_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "tbl_transaction_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_survey_property_details" ADD CONSTRAINT "tbl_survey_property_details_propertyMaster_id_fkey" FOREIGN KEY ("propertyMaster_id") REFERENCES "tbl_survey_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_survey_property_floor" ADD CONSTRAINT "tbl_survey_property_floor_propertyMaster_id_fkey" FOREIGN KEY ("propertyMaster_id") REFERENCES "tbl_survey_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_survey_property_owner" ADD CONSTRAINT "tbl_survey_property_owner_propertyMaster_id_fkey" FOREIGN KEY ("propertyMaster_id") REFERENCES "tbl_survey_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_survey_owner_document" ADD CONSTRAINT "tbl_survey_owner_document_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "tbl_survey_property_owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_survey_property_document" ADD CONSTRAINT "tbl_survey_property_document_propertyMaster_id_fkey" FOREIGN KEY ("propertyMaster_id") REFERENCES "tbl_survey_property_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
