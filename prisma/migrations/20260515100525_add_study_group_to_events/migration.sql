-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "studyGroupId" TEXT;

-- CreateIndex
CREATE INDEX "Event_studyGroupId_idx" ON "Event"("studyGroupId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_studyGroupId_fkey" FOREIGN KEY ("studyGroupId") REFERENCES "StudyGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
