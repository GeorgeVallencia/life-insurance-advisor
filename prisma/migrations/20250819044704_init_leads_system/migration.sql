/*
  Warnings:

  - The primary key for the `lead_activities` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `adminId` on the `lead_activities` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `lead_activities` table. All the data in the column will be lost.
  - You are about to drop the column `leadId` on the `lead_activities` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `lead_activities` table. All the data in the column will be lost.
  - The `id` column on the `lead_activities` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `leads` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `assignedTo` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `conversationId` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `coverageNeed` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `followUpDate` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `leads` table. All the data in the column will be lost.
  - The `id` column on the `leads` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `leads` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[email]` on the table `leads` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `activity_type` to the `lead_activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lead_id` to the `lead_activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `first_name` to the `leads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `leads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_id` to the `leads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `leads` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `leads` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."lead_status" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "public"."gender" AS ENUM ('MALE', 'FEMALE');

-- DropForeignKey
ALTER TABLE "public"."lead_activities" DROP CONSTRAINT "lead_activities_leadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."leads" DROP CONSTRAINT "leads_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."leads" DROP CONSTRAINT "leads_userId_fkey";

-- AlterTable
ALTER TABLE "public"."lead_activities" DROP CONSTRAINT "lead_activities_pkey",
DROP COLUMN "adminId",
DROP COLUMN "createdAt",
DROP COLUMN "leadId",
DROP COLUMN "type",
ADD COLUMN     "activity_type" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lead_id" INTEGER NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "performed_by" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."leads" DROP CONSTRAINT "leads_pkey",
DROP COLUMN "assignedTo",
DROP COLUMN "conversationId",
DROP COLUMN "country",
DROP COLUMN "coverageNeed",
DROP COLUMN "createdAt",
DROP COLUMN "firstName",
DROP COLUMN "followUpDate",
DROP COLUMN "lastName",
DROP COLUMN "sessionId",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "assigned_to" TEXT,
ADD COLUMN     "concerns" JSONB,
ADD COLUMN     "conversation_id" TEXT,
ADD COLUMN     "conversion_date" TIMESTAMP(3),
ADD COLUMN     "coverage_amount" INTEGER,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "dependents" INTEGER DEFAULT 0,
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "follow_up_date" TIMESTAMP(3),
ADD COLUMN     "gender" "public"."gender",
ADD COLUMN     "income" INTEGER,
ADD COLUMN     "last_contacted" TIMESTAMP(3),
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "marital_status" TEXT,
ADD COLUMN     "mortgage" INTEGER,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "session_id" TEXT NOT NULL,
ADD COLUMN     "smoker" BOOLEAN DEFAULT false,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'website',
ADD COLUMN     "state" TEXT,
ADD COLUMN     "student_loans" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "phone" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."lead_status" NOT NULL DEFAULT 'NEW',
ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "public"."lead_quotes" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "carrier" TEXT NOT NULL,
    "monthly_premium" DECIMAL(10,2) NOT NULL,
    "annual_premium" DECIMAL(10,2) NOT NULL,
    "coverage_amount" INTEGER NOT NULL,
    "term" INTEGER NOT NULL,
    "product_name" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_tags" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_tags_lead_id_tag_key" ON "public"."lead_tags"("lead_id", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_key" ON "public"."leads"("email");

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_quotes" ADD CONSTRAINT "lead_quotes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_activities" ADD CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_tags" ADD CONSTRAINT "lead_tags_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
