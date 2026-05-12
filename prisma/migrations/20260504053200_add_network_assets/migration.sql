-- CreateTable
CREATE TABLE "NetworkAsset" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "ownerName" TEXT,
    "deviceName" TEXT,
    "adapterName" TEXT,
    "ipv4Address" TEXT NOT NULL,
    "ipv6Address" TEXT,
    "macAddress" TEXT,
    "subnetMask" TEXT,
    "gateway" TEXT,
    "dnsServer" TEXT,
    "dhcpEnabled" BOOLEAN,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_USE',
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NetworkAsset_ipv4Address_key" ON "NetworkAsset"("ipv4Address");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkAsset_macAddress_key" ON "NetworkAsset"("macAddress");

-- CreateIndex
CREATE INDEX "NetworkAsset_ownerId_idx" ON "NetworkAsset"("ownerId");

-- CreateIndex
CREATE INDEX "NetworkAsset_status_idx" ON "NetworkAsset"("status");

-- AddForeignKey
ALTER TABLE "NetworkAsset" ADD CONSTRAINT "NetworkAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
