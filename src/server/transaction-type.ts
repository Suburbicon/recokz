import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { protectedProcedure } from "@/shared/lib/trpc/server";
import { z } from "zod";

export const transactionTypeRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        category: z.enum(["income", "expense"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const transactionTypes = await ctx.prisma.transactionType.findMany({
        include: {
          organization: true,
        },
        where: {
          OR: [
            {
              organizationId: null,
            },
            {
              organizationId: ctx.organizationId || null,
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return transactionTypes;
    }),
  create: protectedProcedure
    .input(
      z.object({ name: z.string(), category: z.enum(["income", "expense"]) }),
    )
    .mutation(async ({ ctx, input }) => {
      const transactionType = await ctx.prisma.transactionType.create({
        data: {
          name: input.name,
          category: input.category,
          organizationId: ctx.organizationId,
        },
      });
      return transactionType;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.transactionType.delete({
        where: { id: input.id },
      });
    }),
});

export type TransactionTypeRouter = typeof transactionTypeRouter;
