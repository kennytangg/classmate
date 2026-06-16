-- Prevent duplicate event notifications created by concurrent polls.
-- NULL values are treated as distinct in PostgreSQL unique indexes, so
-- notifications without a sourceId (e.g. connection requests) are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS "Notification_userId_sourceType_sourceId_key"
  ON "Notification"("userId", "sourceType", "sourceId");
