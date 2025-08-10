import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { protectedProcedure } from "@/shared/lib/trpc/server";
import { z } from "zod";

export const crmTransactionRouter = createTRPCRouter({
    getAll: protectedProcedure
        .query(async ({ ctx, input}) => {
            const transactions = await ctx.prisma.crmTransaction.findMany({
                where: {
                    organizationId: ctx.organizationId
                },
                orderBy: {
                    createdAt: "desc"
                }
            });
            return transactions;
        }),
    update: protectedProcedure
        .input(z.object({
            transactionId: z.string(),
            bankTransactionId: z.string()
        }))
        .mutation(async ({ctx, input}) => {
            await ctx.prisma.crmTransaction.update({
                where: { id: input.transactionId },
                data: { bankTransactionId: input.bankTransactionId }
            })
        })
})

export type CrmTransactionRouter = typeof crmTransactionRouter;