-- CreateEnum
CREATE TYPE "NewsProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "processingStatus" "NewsProcessingStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "News_processingStatus_idx" ON "News"("processingStatus");
