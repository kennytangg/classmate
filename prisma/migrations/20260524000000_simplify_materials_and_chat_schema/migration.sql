-- Remove subject from ChatSession (no longer needed)
ALTER TABLE "ChatSession" DROP COLUMN IF EXISTS "subject";

-- Simplify StudyMaterial: remove description and subject, add fileSize
ALTER TABLE "StudyMaterial" DROP COLUMN IF EXISTS "description";
ALTER TABLE "StudyMaterial" DROP COLUMN IF EXISTS "subject";
ALTER TABLE "StudyMaterial" ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;

-- Drop the subject index on StudyMaterial
DROP INDEX IF EXISTS "StudyMaterial_subject_idx";
