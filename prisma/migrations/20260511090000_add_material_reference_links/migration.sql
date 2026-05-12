ALTER TABLE "Material" ADD COLUMN "parentMaterialId" TEXT;

CREATE INDEX "Material_parentMaterialId_idx" ON "Material"("parentMaterialId");

ALTER TABLE "Material"
  ADD CONSTRAINT "Material_parentMaterialId_fkey"
  FOREIGN KEY ("parentMaterialId") REFERENCES "Material"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
