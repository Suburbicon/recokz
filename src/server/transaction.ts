import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { protectedProcedure } from "@/shared/lib/trpc/server";
import { z } from "zod";

export const transactionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        meta: z.any(),
        documentId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const transaction = await ctx.prisma.transaction.create({
        data: {
          amount: input.amount,
          date: new Date().toISOString(),
          meta: input.meta,
          documentId: input.documentId,
          transactionId: "0",
          organizationId: ctx.organizationId,
        },
      });

      return transaction;
    }),
  createCash: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        reportId: z.string(),
        addedBy: z.string(),
        purpose: z.string(),
        documentId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Создаем транзакцию с метаданными для наличных
      const transaction = await ctx.prisma.transaction.create({
        data: {
          amount: input.amount,
          date: new Date().toISOString(),
          meta: {
            byCash: true,
            addedBy: input.addedBy,
            purpose: input.purpose,
          },
          documentId: input.documentId,
          transactionId: "0",
          organizationId: ctx.organizationId,
        },
      });

      // Создаем reconciliation для наличной транзакции
      const reconciliation = await ctx.prisma.reconciliation.create({
        data: {
          reportId: input.reportId,
          crmTransactionId: transaction.id,
          bankTransactionId: null,
        },
      });

      return { transaction, reconciliation };
    }),
});
