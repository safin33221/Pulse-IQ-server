/*
  Warnings:

  - Made the column `categoryId` on table `NewsFeed` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "NewsFeed" DROP CONSTRAINT "NewsFeed_categoryId_fkey";

-- AlterTable
ALTER TABLE "NewsFeed" ALTER COLUMN "categoryId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "NewsFeed" ADD CONSTRAINT "NewsFeed_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
