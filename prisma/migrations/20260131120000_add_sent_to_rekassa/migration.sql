-- Add sent_to_rekassa flag for CRM transactions
ALTER TABLE "crm_transactions"
ADD COLUMN "sent_to_rekassa" BOOLEAN NOT NULL DEFAULT false;
