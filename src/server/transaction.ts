import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { protectedProcedure } from "@/shared/lib/trpc/server";
import { z } from "zod";

export const transactionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        meta: z.any(),
        documentId: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
    const transaction = await ctx.prisma.transaction.create({
      data: {
        amount: input.amount,
        date: new Date().toISOString(),
        meta: input.meta,
        documentId: input.documentId,
        transactionId: '0',
        organizationId: ctx.organizationId
      },
    });

    return transaction;
  }),
});
