CREATE TABLE "UsefulLink" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "authorId" TEXT,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsefulLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UsefulLink_category_idx" ON "UsefulLink"("category");
CREATE INDEX "UsefulLink_createdAt_idx" ON "UsefulLink"("createdAt");

ALTER TABLE "UsefulLink"
ADD CONSTRAINT "UsefulLink_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
