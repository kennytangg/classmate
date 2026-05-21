-- Add sourceType and sourceId columns to Notification for deep-linking
ALTER TABLE "Notification" ADD COLUMN "sourceId" TEXT,
ADD COLUMN "sourceType" TEXT;

-- Drop forum tags (ForumTag table and its join table)
ALTER TABLE "_ForumPostToForumTag" DROP CONSTRAINT "_ForumPostToForumTag_A_fkey";
ALTER TABLE "_ForumPostToForumTag" DROP CONSTRAINT "_ForumPostToForumTag_B_fkey";
DROP TABLE "ForumTag";
DROP TABLE "_ForumPostToForumTag";

-- Drop category column and its index from ForumPost
DROP INDEX IF EXISTS "ForumPost_category_idx";
ALTER TABLE "ForumPost" DROP COLUMN "category";
