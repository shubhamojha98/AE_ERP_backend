-- CreateTable
CREATE TABLE "tbl_user_login_logs" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "login_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "ismobileDesktop" TEXT,
    "is_success" BOOLEAN NOT NULL DEFAULT false,
    "entryBy" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_user_login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_user_logout_logs" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "login_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "entryBy" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_user_logout_logs_pkey" PRIMARY KEY ("id")
);
