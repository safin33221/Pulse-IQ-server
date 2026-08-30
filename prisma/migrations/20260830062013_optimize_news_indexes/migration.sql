-- CreateIndex
CREATE INDEX "News_status_publishedAt_createdAt_idx" ON "News"("status", "publishedAt", "createdAt");

-- CreateIndex
CREATE INDEX "News_status_categoryId_publishedAt_createdAt_idx" ON "News"("status", "categoryId", "publishedAt", "createdAt");

-- CreateIndex
CREATE INDEX "News_status_sourceId_publishedAt_createdAt_idx" ON "News"("status", "sourceId", "publishedAt", "createdAt");

-- CreateIndex
CREATE INDEX "NewsFeed_isActive_sourceId_idx" ON "NewsFeed"("isActive", "sourceId");
