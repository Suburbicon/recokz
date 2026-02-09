-- Add conf table for organization credentials
CREATE TABLE "conf" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "rekassa_id_encrypted" TEXT,
  "rekassa_token_encrypted" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "conf_pkey" PRIMARY KEY ("id")
);

-- Unique per organization
CREATE UNIQUE INDEX "conf_organization_id_key" ON "conf"("organization_id");

-- Relation to organizations
ALTER TABLE "conf"
ADD CONSTRAINT "conf_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
