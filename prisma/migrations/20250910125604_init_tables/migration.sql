-- DropForeignKey
ALTER TABLE "reconciliations" DROP CONSTRAINT "reconciliations_bank_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "reconciliations" DROP CONSTRAINT "reconciliations_crm_transaction_id_fkey";

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "transactionId" TEXT;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_bank_transaction_id_fkey" FOREIGN KEY ("bank_transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_crm_transaction_id_fkey" FOREIGN KEY ("crm_transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
