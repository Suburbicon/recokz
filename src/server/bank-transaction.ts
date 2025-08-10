import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { protectedProcedure } from "@/shared/lib/trpc/server";
import { z } from "zod";


export const bankTransactionRouter = createTRPCRouter({
    create: protectedProcedure
        .input(z.object({
            amount: z.number(),
            date: z.string(),
            meta: z.any(),
            organizationId: z.string(),
            transactionId: z.string()
        }))
        .mutation(async ({ ctx, input}) => {
            const bankT = await ctx.prisma.bankTransaction.create({
                data: {
                    amount: input.amount,
                    date: new Date(input.date),
                    meta: input.meta,
                    organizationId: input.organizationId,
                    transactionId: input.transactionId
                }
            });
            return bankT;
        })
})

export type BankTransactionRouter = typeof bankTransactionRouter;