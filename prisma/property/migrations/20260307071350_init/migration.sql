-- CreateTable
CREATE TABLE "tbl_hashing" (
    "id" SERIAL NOT NULL,
    "reference_id" INTEGER NOT NULL,
    "table_name" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "taxn_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "seq_no" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_hashing_pkey" PRIMARY KEY ("id")
);
