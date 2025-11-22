import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { protectedProcedure } from "@/shared/lib/trpc/server";
import { z } from "zod";

export const crmTransactionRouter = createTRPCRouter({
    getAll: protectedProcedure
        .query(async ({ ctx, input}) => {
            const transactions = await ctx.prisma.crmTransaction.findMany({
                where: {
                    organizationId: ctx.organizationId,
                    transactionId: {
                        not: '0'
                    }
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
        }),
    retrive: protectedProcedure
        .input(z.object({
            id: z.string()
        }))
        .query(async ({ctx, input}) => {
            const transaction = await ctx.prisma.crmTransaction.findFirst({
                where: {
                    organizationId: ctx.organizationId,
                    id: input.id
                }
            })
            return transaction;
        }),
    delete: protectedProcedure
        .input(z.object({
            id: z.string()
        }))
        .mutation(async ({ctx, input}) => {
            await ctx.prisma.crmTransaction.delete({
                where: { id: input.id }
            })
        })
})

export type CrmTransactionRouter = typeof crmTransactionRouter;
