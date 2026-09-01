-- This is additive: existing topics remain unchanged and become root topics.
ALTER TABLE "Topic" ADD COLUMN "parentId" TEXT;

CREATE INDEX "Topic_parentId_idx" ON "Topic"("parentId");

ALTER TABLE "Topic"
  ADD CONSTRAINT "Topic_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Topic"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
