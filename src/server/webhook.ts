import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { publicProcedure } from "@/shared/lib/trpc/server";
import { ReportStatus } from "@prisma/client";
import { z } from "zod";

export const webhookRouter = createTRPCRouter({
  receiveTransaction: publicProcedure
    .input(z.unknown({}))
    .mutation(async ({ ctx, input }) => {
      // input — это любой JSON-объект
      console.log(input);
      await ctx.prisma.transaction.createMany({
        data: {
          amount: 100,
          date: new Date(),
          meta: input as any,
          documentId: Math.random().toString(),
        },
      });

      return { success: true };
    }),
});
