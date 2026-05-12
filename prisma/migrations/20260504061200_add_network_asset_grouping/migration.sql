-- AlterTable
ALTER TABLE "NetworkAsset"
ADD COLUMN "groupName" TEXT NOT NULL DEFAULT '일반',
ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "NetworkAsset_groupName_idx" ON "NetworkAsset"("groupName");
