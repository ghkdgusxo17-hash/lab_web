CREATE TABLE IF NOT EXISTS "LabNote" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "draftDisplayLabel" TEXT,
  "draftContent" TEXT,
  "draftTheme" TEXT NOT NULL DEFAULT 'SKY',
  "publicDisplayLabel" TEXT,
  "publicContent" TEXT,
  "publicTheme" TEXT NOT NULL DEFAULT 'SKY',
  "status" TEXT NOT NULL DEFAULT 'EMPTY',
  "adminComment" TEXT,
  "lastSubmittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LabNote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LabNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "LabNote_userId_key" ON "LabNote"("userId");
CREATE INDEX IF NOT EXISTS "LabNote_status_idx" ON "LabNote"("status");
CREATE INDEX IF NOT EXISTS "LabNote_approvedAt_idx" ON "LabNote"("approvedAt");
