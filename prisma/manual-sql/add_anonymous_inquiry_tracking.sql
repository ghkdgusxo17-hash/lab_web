ALTER TABLE "AnonymousInquiryRoom"
  ADD COLUMN IF NOT EXISTS "policyAcceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "createdIpAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "createdIpMasked" TEXT,
  ADD COLUMN IF NOT EXISTS "createdUserAgent" TEXT,
  ADD COLUMN IF NOT EXISTS "lastVisitorIpAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "lastVisitorIpMasked" TEXT,
  ADD COLUMN IF NOT EXISTS "lastVisitorUserAgent" TEXT;

ALTER TABLE "AnonymousInquiryMessage"
  ADD COLUMN IF NOT EXISTS "senderIpAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "senderIpMasked" TEXT,
  ADD COLUMN IF NOT EXISTS "senderUserAgent" TEXT;

CREATE INDEX IF NOT EXISTS "AnonymousInquiryRoom_createdIpAddress_idx"
  ON "AnonymousInquiryRoom"("createdIpAddress");

CREATE INDEX IF NOT EXISTS "AnonymousInquiryRoom_lastVisitorIpAddress_idx"
  ON "AnonymousInquiryRoom"("lastVisitorIpAddress");

CREATE INDEX IF NOT EXISTS "AnonymousInquiryMessage_senderIpAddress_idx"
  ON "AnonymousInquiryMessage"("senderIpAddress");
