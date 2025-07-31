import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { protectedProcedure } from "@/shared/lib/trpc/server";


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
        })
})

export type TransactionRouter = typeof crmTransactionRouter;