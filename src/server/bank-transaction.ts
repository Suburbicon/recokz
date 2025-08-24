import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { protectedProcedure } from "@/shared/lib/trpc/server";
import { z } from "zod";
import dayjs from 'dayjs';


export const bankTransactionRouter = createTRPCRouter({
    create: protectedProcedure
        .input(z.object({
            amount: z.string(),
            date: z.string(),
            meta: z.any(),
            organizationId: z.string(),
            transactionId: z.string()
        }))
        .mutation(async ({ ctx, input}) => {
            const bankT = await ctx.prisma.bankTransaction.create({
                data: {
                    amount: input.amount,
                    date: dayjs(input.date).toISOString(),
                    meta: input.meta,
                    organizationId: input.organizationId,
                    transactionId: input.transactionId
                }
            });
            return bankT;
        }),
    retrive: protectedProcedure
        .input(z.object({
            id: z.string()
        }))
        .query(async ({ctx, input}) => {
            const transaction = await ctx.prisma.bankTransaction.findFirst({
                where: {
                    organizationId: ctx.organizationId,
                    id: input.id
                }
            })
            return transaction;
        })
})

export type BankTransactionRouter = typeof bankTransactionRouter;