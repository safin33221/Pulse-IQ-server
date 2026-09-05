/*
  Warnings:

  - You are about to drop the column `interests` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `preferences` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CareerRole" DROP CONSTRAINT "CareerRole_careerFieldId_fkey";

-- DropIndex
DROP INDEX "User_email_idx";

-- DropIndex
DROP INDEX "User_username_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "interests",
DROP COLUMN "preferences",
DROP COLUMN "refreshToken";

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBehaviorProfile" (
    "userId" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalSaves" INTEGER NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "totalReadingTimeMs" BIGINT NOT NULL DEFAULT 0,
    "avgReadingTimeMs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgScrollPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "firstActiveAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "profileVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBehaviorProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "topicScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "careerScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skillScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "behaviorScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freshnessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "semanticScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL,
    "reason" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "UserRecommendation_userId_rank_idx" ON "UserRecommendation"("userId", "rank");

-- CreateIndex
CREATE INDEX "UserRecommendation_userId_score_idx" ON "UserRecommendation"("userId", "score");

-- CreateIndex
CREATE INDEX "UserRecommendation_expiresAt_idx" ON "UserRecommendation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserRecommendation_userId_newsId_key" ON "UserRecommendation"("userId", "newsId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerRole" ADD CONSTRAINT "CareerRole_careerFieldId_fkey" FOREIGN KEY ("careerFieldId") REFERENCES "CareerField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBehaviorProfile" ADD CONSTRAINT "UserBehaviorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRecommendation" ADD CONSTRAINT "UserRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRecommendation" ADD CONSTRAINT "UserRecommendation_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;
