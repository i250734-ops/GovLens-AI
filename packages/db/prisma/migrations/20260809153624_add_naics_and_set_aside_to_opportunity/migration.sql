/*
  Warnings:

  - You are about to drop the column `summaryAI` on the `Opportunity` table. All the data in the column will be lost.
  - Added the required column `naicsCode` to the `Opportunity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Opportunity" DROP COLUMN "summaryAI",
ADD COLUMN     "naicsCode" TEXT NOT NULL,
ADD COLUMN     "setAside" TEXT;
