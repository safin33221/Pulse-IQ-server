-- AlterTable
ALTER TABLE "NewsFeed" ADD COLUMN     "categoryId" TEXT;

-- CreateIndex
CREATE INDEX "NewsFeed_isActive_idx" ON "NewsFeed"("isActive");

-- AddForeignKey
ALTER TABLE "NewsFeed" ADD CONSTRAINT "NewsFeed_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
