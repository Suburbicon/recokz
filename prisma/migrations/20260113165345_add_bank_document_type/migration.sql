-- CreateEnum
CREATE TYPE "BankDocumentType" AS ENUM ('sales_report', 'bank_statement');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "bank_document_type" "BankDocumentType";
