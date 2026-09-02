-- CreateTable
CREATE TABLE "tbl_vacant_tax" (
    "id" SERIAL NOT NULL,
    "ulb_id" INTEGER NOT NULL,
    "calculationFactor" TEXT NOT NULL,
    "roadTypeId" INTEGER NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "dateOfEffect" TIMESTAMP(3) NOT NULL,
    "recStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_vacant_tax_pkey" PRIMARY KEY ("id")
);
