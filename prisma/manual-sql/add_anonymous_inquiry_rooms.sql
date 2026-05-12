CREATE TABLE IF NOT EXISTS "AnonymousInquiryRoom" (
  "id" TEXT NOT NULL,
  "roomCode" TEXT NOT NULL,
  "accessCode" TEXT NOT NULL,
  "nickname" TEXT,
  "category" TEXT NOT NULL,
  "topic" TEXT,
  "includeTestResult" BOOLEAN NOT NULL DEFAULT false,
  "testResultTitle" TEXT,
  "testResultSummary" TEXT,
  "testTopAxes" TEXT,
  "testFitScore" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAdminReadAt" TIMESTAMP(3),
  "lastVisitorReadAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnonymousInquiryRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AnonymousInquiryMessage" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "senderType" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnonymousInquiryMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AnonymousInquiryMessage_roomId_fkey"
    FOREIGN KEY ("roomId")
    REFERENCES "AnonymousInquiryRoom"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "AnonymousInquiryRoom_roomCode_key"
  ON "AnonymousInquiryRoom"("roomCode");

CREATE INDEX IF NOT EXISTS "AnonymousInquiryRoom_createdAt_idx"
  ON "AnonymousInquiryRoom"("createdAt");

CREATE INDEX IF NOT EXISTS "AnonymousInquiryRoom_lastMessageAt_idx"
  ON "AnonymousInquiryRoom"("lastMessageAt");

CREATE INDEX IF NOT EXISTS "AnonymousInquiryMessage_roomId_createdAt_idx"
  ON "AnonymousInquiryMessage"("roomId", "createdAt");
