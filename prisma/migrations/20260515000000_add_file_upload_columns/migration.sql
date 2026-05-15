-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "fileName" TEXT,
ADD COLUMN IF NOT EXISTS "fileSize" INTEGER,
ADD COLUMN IF NOT EXISTS "fileType" TEXT,
ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;

-- AlterTable
ALTER TABLE "StudyGroupMessage" ADD COLUMN IF NOT EXISTS "fileName" TEXT,
ADD COLUMN IF NOT EXISTS "fileSize" INTEGER,
ADD COLUMN IF NOT EXISTS "fileType" TEXT,
ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FlaggedContent_resolvedBy_idx" ON "FlaggedContent"("resolvedBy");
