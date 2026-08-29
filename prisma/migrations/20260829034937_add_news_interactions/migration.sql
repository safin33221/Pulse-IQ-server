-- CreateEnum
CREATE TYPE "NewsInteractionType" AS ENUM ('VIEW', 'CLICK', 'LIKE', 'SAVE', 'SHARE');

-- CreateTable
CREATE TABLE "NewsInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "type" "NewsInteractionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsInteraction_userId_createdAt_idx" ON "NewsInteraction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "NewsInteraction_userId_newsId_idx" ON "NewsInteraction"("userId", "newsId");

-- CreateIndex
CREATE INDEX "NewsInteraction_newsId_type_idx" ON "NewsInteraction"("newsId", "type");

-- AddForeignKey
ALTER TABLE "NewsInteraction" ADD CONSTRAINT "NewsInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsInteraction" ADD CONSTRAINT "NewsInteraction_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;
