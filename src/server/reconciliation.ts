import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { protectedProcedure } from "@/shared/lib/trpc/server";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Transaction } from "@prisma/client";

export const reconciliationRouter = createTRPCRouter({
  reconcile: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify the report exists and belongs to the organization
        const report = await ctx.prisma.report.findUnique({
          where: {
            id: input.reportId,
            organizationId: ctx.organizationId,
          },
          include: {
            documents: {
              include: {
                transactions: true,
              },
            },
          },
        });

        if (!report) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Отчет не найден или у вас нет доступа к нему",
          });
        }

        // Get bank and CRM transactions
        const bankTransactions = report.documents
          .filter((doc: { type: string }) => doc.type === "bank")
          .flatMap((doc: any) => doc.transactions);

        const crmTransactions = report.documents
          .filter((doc: { type: string }) => doc.type === "crm")
          .flatMap((doc: any) => doc.transactions);

        // Simple reconciliation logic - match transactions by amount and date
        // This is a basic implementation that can be enhanced with more sophisticated matching
        const reconciliations = [];
        const matchedCrmTransactionIds = new Set<string>();

        // First pass: Find matched transactions
        for (const bankTransaction of bankTransactions) {
          const matchingCrmTransaction = crmTransactions.find(
            (crmTx: any) =>
              crmTx.amount === bankTransaction.amount &&
              Math.abs(
                new Date(crmTx.date).getTime() -
                  new Date(bankTransaction.date).getTime(),
              ) <
                24 * 60 * 60 * 1000, // Within 24 hours
          );

          if (matchingCrmTransaction) {
            // Matched transaction
            reconciliations.push({
              reportId: input.reportId,
              bankTransactionId: bankTransaction.id,
              crmTransactionId: matchingCrmTransaction.id,
            });
            matchedCrmTransactionIds.add(matchingCrmTransaction.id);
          } else {
            // Unmatched bank transaction
            reconciliations.push({
              reportId: input.reportId,
              bankTransactionId: bankTransaction.id,
              crmTransactionId: null,
            });
          }
        }

        // Second pass: Add unmatched CRM transactions
        for (const crmTransaction of crmTransactions) {
          if (!matchedCrmTransactionIds.has(crmTransaction.id)) {
            // Unmatched CRM transaction
            reconciliations.push({
              reportId: input.reportId,
              bankTransactionId: null,
              crmTransactionId: crmTransaction.id,
            });
          }
        }

        // Delete existing reconciliations for this report
        await ctx.prisma.reconciliation.deleteMany({
          where: {
            reportId: input.reportId,
          },
        });

        // Create new reconciliations
        const result = await ctx.prisma.reconciliation.createMany({
          data: reconciliations,
        });

        // Calculate statistics
        const matchedCount = reconciliations.filter(
          (r) => r.bankTransactionId && r.crmTransactionId,
        ).length;
        const unmatchedBankCount = reconciliations.filter(
          (r) => r.bankTransactionId && !r.crmTransactionId,
        ).length;
        const unmatchedCrmCount = reconciliations.filter(
          (r) => !r.bankTransactionId && r.crmTransactionId,
        ).length;

        return {
          success: true,
          message: "Сверка выполнена успешно",
          reconciliationsCount: result.count,
          matchedCount,
          unmatchedBankCount,
          unmatchedCrmCount,
          bankTransactionsCount: bankTransactions.length,
          crmTransactionsCount: crmTransactions.length,
        };
      } catch (error) {
        console.error("Error during reconciliation:", error);

        // Re-throw TRPCError as-is
        if (error instanceof TRPCError) {
          throw error;
        }

        // Wrap other errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Ошибка при выполнении сверки",
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        typeId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updates } = input;

        // Verify the reconciliation exists and belongs to the organization
        const reconciliation = await ctx.prisma.reconciliation.findUnique({
          where: { id },
          include: {
            report: true,
          },
        });

        if (
          !reconciliation ||
          reconciliation.report.organizationId !== ctx.organizationId
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Сверка не найдена или у вас нет доступа к ней",
          });
        }

        await ctx.prisma.reconciliation.update({
          where: { id },
          data: updates,
        });

        return {
          success: true,
          message: "Сверка обновлена успешно",
        };
      } catch (error) {
        console.error("Error updating reconciliation:", error);

        // Re-throw TRPCError as-is
        if (error instanceof TRPCError) {
          throw error;
        }

        // Wrap other errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Ошибка при обновлении сверки",
          cause: error,
        });
      }
    }),
});
